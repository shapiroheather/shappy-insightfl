###############################################################################

# import what i need

import os
import re
import sys
import numpy as np
import pandas as pd
import urllib2
import datetime
from bs4 import BeautifulSoup
import matplotlib
import matplotlib.pyplot as plt
import random as random
import pymysql 
import requests

import nltk
import nltk.tokenize
from nltk.stem.wordnet import WordNetLemmatizer
from nltk.tokenize.api import StringTokenizer

from sklearn.ensemble import RandomForestRegressor
from sklearn.ensemble import RandomForestClassifier
from sklearn import cross_validation
from sklearn.cross_validation import cross_val_score
from sklearn import grid_search
from sklearn import metrics


###############################################################################

# read in the data

a = pd.read_csv('/Users/heathershapiro/Documents/My_Docs/INSIGHT/watsi_project/Watsi_transparency_edited.csv')
b = pd.read_csv('/Users/heathershapiro/Documents/My_Docs/INSIGHT/watsi_project/scraped_data_v5.csv')
gender_data = pd.read_csv('/Users/heathershapiro/Documents/My_Docs/INSIGHT/watsi_project/patient_gender.csv')
photo_data = pd.read_csv('/Users/heathershapiro/Documents/My_Docs/INSIGHT/watsi_project/Watsi_photos.csv')

# merge the data
d = a.merge(b,on='ProfileURL')
#ccc = c.merge(photo_data,on='ProfileURL')

#d = ccc.merge(gender_data,on='PatientID')

# some brief clean-up...

d = d[d.Cost_y <= 2000]

#d = d[pd.notnull(d['PatientID'])]

#d = d[d.TimeToFunding <7]


# get ready for random forest



def prepare_data_for_RF(d):
    """Make a couple of data alterations to allow random forest to work.
    """
    
    #extract the length of the captions:
    length = []
    for row in d.Caption:
        length.append(len(row))    
    d['cLen'] = length
    
    day = []
    mo = []
    
    
    
    for row in d.DatePosted:
        day.append(datetime.datetime.strptime(row, '%B %d, %Y').strftime('%A'))
        mo.append(row[0:3])
    d['weekday_posted'] = day 
    d['month'] = mo  
        
    #convert month to numerical values
    numeric_months = {'Jan': 1, 'Feb': 2,'Mar': 3,'Apr': 4,'May': 5,'Jun': 6,'Jul': 7,'Aug': 8,'Sep': 9,'Oct': 10,'Nov': 11,'Dec': 12}
    d['mo_num'] = d['month'].map(numeric_months) 
    
     
    #convert weekday_posted to numerical values
    numeric_weekdays = {'Monday': 1, 'Tuesday': 2,'Wednesday': 3,'Thursday': 4,'Friday': 5,'Saturday': 6,'Sunday': 7}
    weekday_binary = {'Monday': 0, 'Tuesday': 0,'Wednesday': 0,'Thursday': 0,'Friday': 0,'Saturday': 0,'Sunday': 0}
    d['day_num'] = d['weekday_posted'].map(numeric_weekdays) 
    d['day_bin'] = d['weekday_posted'].map(weekday_binary)
        
    #convert country to numerical values
    numeric_regions = {'Burma': 1, 'Cambodia': 2,'Ethiopia': 3,'Ghana': 4,'Guatemala': 5,'Haiti': 6,'Kenya': 7,'Malawi': 8,'Mali': 9,'Nepal': 10,'Nigeria': 11,'Panama': 12,'Philippines': 13,'Somaliland': 14,'Tanzania': 15,'Thailand': 16,'Uganda': 17,'Zambia': 18}
    numeric_continents = {'Burma': 2, 'Cambodia': 2,'Ethiopia': 1,'Ghana': 1,'Guatemala': 3,'Haiti': 3,'Kenya': 1,'Malawi': 1,'Mali': 1,'Nepal': 2,'Nigeria': 1,'Panama': 3,'Philippines': 2,'Somaliland': 1,'Tanzania': 1,'Thailand': 2,'Uganda': 1,'Zambia': 1}
    d['region_num'] = d['Country_x'].map(numeric_regions) 
    d['continent_num'] = d['Country_x'].map(numeric_continents)     
    
    #convert healthcare facility to numerical values
    numeric_centers = {'African Mission Healthcare Foundation': 1, 'Burma Border Projects': 2,'Children\'s Surgical Centre': 3,'CURE International': 4,'Dr. Rick Hodes': 5,'Edna Adan Hospital': 5,'Floating Doctors': 5,'Haiti Cardiac Alliance': 5,'Hope for West Africa': 5,'International Care Ministries': 5,'Living Hope Haiti': 5,'Lwala Community Alliance': 6, 'MedicalPartner': 5,'Ortho FOCOS': 5, 'Partner for Surgery': 5,'Possible': 7, 'Project Medishare': 8,'Project Muso': 5, 'The Kellermann Foundation': 5,'World Altering Medicine': 5, 'Wuqu??? Kawoq': 9}
    d['medical_facility'] = d['MedicalPartner_x'].map(numeric_centers) 
    
    
    d = d.reset_index()
    for irow in xrange(len(d)):
        if np.isnan(d.medical_facility[irow]):
            d.medical_facility[irow] = np.float(9)
        else:
            d.medical_facility[irow] = d.medical_facility[irow]
        
    #convert gender to numerical values
    #numeric_gender = {'Female': 1, 'Male': 2}
    #d['gender_num'] = d['gender'].map(numeric_gender)
    
    return d




d = prepare_data_for_RF(d)

###############################################################################

# try some NLP

# def lemma_tokenize(paragraph):
#     lmtzr = WordNetLemmatizer()
#     return [lmtzr.lemmatize(word.lower() for sentence in tokenize(paragraph) for word in sentece)
# 
# def tokenize(d.Caption):
#     try:
#         detector = tokenize.detector
#     except AttributeError:
#         try:
#             detector.nltk.data.load('tokenizers/punkt/english.pickle')
#         except LookupError:
#             nltk.download('punkt')
#             detector = nltk.data.load('tokenizers/punkt/english.pickle.')
#         tokenize.detector = detector
#         
#     return [
#         [
#             word
#             for word in nltk.tokenize.word_tokenize(sentence)
#             if not in stopwords()
#         ]
#         for sentence in detector.tokenize(paragraph.strip())
#     ]
#     
# def stopwords():
#     try:
#         stop_words = stopwords.stop_words
#     except AttributeError:
#         try:
#             stop_words = nltk.corpus.stopwords.words('english')
#         except LookupError:
#             nltk.download('stopwords')
#             stop_words = nltk.corpus.stopwords.words('english')
#         stop_words.extend(['-', ':', '.', '\'', '\',', ',', '#', '/', '@', '.,', '(', ')', 'RT', 'I', 'I''m'])
#         stopwords.stop_words = stop_words
#     return stop_words
#     
#     
###############################################################################

# eliminate TimeToFunding rows that have missing values (i.e. those that have not yet been funded)
d_train = d.dropna(subset=['TimeToFunding'])
d_train = d_train[d_train.TimeToFunding <=20]

d_train['Age'] = d_train['Age'].astype(np.float64)
d_train['Cost_y'] = d_train['Cost_y'].astype(np.float64)

#d_train = d_train[pd.isnull(d_train['eyes'])==False]
#d_train = d_train[pd.isnull(d_train['smiles'])==False]




#d_train=d_train.dropna(subset=['gender'])

d_train['mpd'] = d_train.Cost_y/d_train.TimeToFunding

d_train = d_train.reset_index()


for irow in xrange(len(d_train.mpd)):
    if np.isinf(d_train.mpd[irow]):
        d_train.mpd[irow] = d_train.Cost_y[irow]
    else:
        d_train.mpd[irow] = d_train.mpd[irow]
        
        
    

d_test = d[pd.isnull(d['TimeToFunding'])==True]


###############################################################################

# trying to understand patterns in the data

# matplotlib.pyplot.scatter(d_train.TimeToFunding,d_train.cLen)
# matplotlib.pyplot.show()
# 
# matplotlib.pyplot.scatter(d_train.TimeToFunding,d_train.Cost_y)
# matplotlib.pyplot.show()
# 
# matplotlib.pyplot.scatter(d_train.mo_num,d_train.TimeToFunding)
# matplotlib.pyplot.show()
# 


###############################################################################



# run random forest
    
#predictors = ['Cost_y', 'Age','smiles', 'mo_num', 'eyes', 'continent_num', 'cLen', 'day_num', 'gender_num']

predictors = ['Cost_y', 'Age', 'medical_facility','mo_num',  'continent_num', 'cLen', 'day_num']

numfeat = len(predictors)
 
###############################################################################
## testing



# testing set!
# testing = d_train[0:1795:5]
# # 
# Y_test = testing.TimeToFunding
# X_test = testing[predictors]
# # 
# keep = testing['PatientID']
# training = d_train[~d_train['PatientID'].isin(keep)]
# # 
# # #training = d_train[1:1796:2]
# # 
# # # below is training on a subset of participants:    
# Y_train = training.TimeToFunding # variable to predict
# X_train = training[predictors]




testing = d_train[0:1910:5]

# Y_test = testing.mpd
# X_test = testing[predictors]

keep = testing['PatientID']
training = d_train[~d_train['PatientID'].isin(keep)]


# below is training on a subset of participants:    
Y_train = training.mpd # variable to predict
X_train = training[predictors]


###############################################################################


# training set
#Y_train = d_train.TimeToFunding # variable to predict
#X_train = d_train[predictors]

# testing set!
X_test = d_test[predictors]

##################################################################
### Testing random forest regression

#

#Build "best" random forest model
nfolds = 5 #number of folds to use for cross-validation
parameters = {'n_estimators':[10,100,1000],  'max_features':[3,5,7]}
njobs = 1 #number of jobs to run in parallel
rf_tune = grid_search.GridSearchCV(RandomForestRegressor(), parameters, n_jobs = njobs, cv = nfolds)
rf_opt = rf_tune.fit(X_train,Y_train)
#     
# #Results of the grid search for optimal random forest parameters.
print("Grid of scores:\n" + str(rf_opt.grid_scores_) + "\n")
print("Best zero-one score: " + str(rf_opt.best_score_) + "\n")
print("Optimal Model:\n" + str(rf_opt.best_estimator_) + "\n")
print "Parameters of random forest:\n " , rf_opt.get_params()
# 
#Now use the optimal model's parameters to run random forest
crf = RandomForestRegressor(n_estimators=1000, max_features=3, random_state=33, max_depth=5) # creates object to store parameters
#crf = RandomForestRegressor(n_estimators=1000, max_features=7, random_state=33, max_depth=5) # creates object to store parameters
#crf = RandomForestRegressor(n_estimators=1000, random_state=33, max_depth=5) # creates object to store parameters

print "Parameters used in chosen RF model:\n " , crf.get_params()


crf.fit(X_train, Y_train)

crf.score(X_train, Y_train)
# .4 (20% train set)

#crf.score(X_test, Y_test)
# 0.31 mpd (20% test set)


# df = X_test
# X_test_rearranged = df.apply(np.random.permutation)
# 
# 
# crf.score(X_test_rearranged, Y_test)
# # -.23
# 


##################################################################
## VALIDATION


# test_prediction = crf.predict(X_test)
# 
# 
# test_prediction_df = pd.DataFrame(test_prediction,columns=['Predictions'])
# 
# testing = testing.reset_index(drop=True)
# 
# testing_predictions = testing.merge(test_prediction_df,left_index=True,right_index=True)
# 
# predicted_sorted = testing_predictions.sort(['Predictions'])
# top_predicted_sorted = predicted_sorted.head(20)
# bottom_predicted_sorted = predicted_sorted.tail(20)
# 
# truth_sorted = testing_predictions.sort(['mpd'])
# top_truth_sorted = truth_sorted.head(20)
# bottom_truth_sorted = truth_sorted.tail(20)
# 
# 
# ccc = pd.merge(top_predicted_sorted,top_truth_sorted,on='ProfileURL')
# numerator = len(ccc)
# numfloat = np.float(numerator)
# accuracyTop = (numfloat/20)*100
# # 22.5
# # 50
# 
# ddd = pd.merge(bottom_predicted_sorted,bottom_truth_sorted,on='ProfileURL')
# numerator = len(ddd)
# numfloat = np.float(numerator)
# accuracyBottom = (numfloat/20)*100
# 
# # 47.5
# # 50
# 
# print accuracyTop
# print accuracyBottom
# 
# 
# average_predicted = np.mean(bottom_predicted_sorted.mpd)
# average_truth = np.mean(bottom_truth_sorted.mpd)
# 
# # 
# # ## RANDOMIZED/SHUFFLED DATA BELOW FOR FINAL VALIDATION IN PRESENTATION
# # 
# 
# random_shuffle = []
# tester_shuf = []
# 
# 
# for i in xrange(0,1000):
#     df = X_test
#     X_test_rearranged = df.apply(np.random.permutation)
#     test_prediction_random = crf.predict(X_test_rearranged)
#     bottom_predicted_sorted = np.sort(test_prediction_random)
#     bps = bottom_predicted_sorted[-21:-1]
#     random_shuffle.append(str(np.mean(bps)))
#     random_shuffle[i] = float(random_shuffle[i])
#     tps = test_prediction_random[-21:-1]
#     tester_shuf.append(str(np.mean(tps)))
#     tester_shuf[i] = float(tester_shuf[i])
# 
#     
# plt.hist(tester_shuf, bins=40)
# plt.show()
#     
# plt.hist(random_shuffle, bins=40)
# plt.show()
# 

# 
# test_prediction_random_df = pd.DataFrame(test_prediction_random,columns=['Predictions'])
# predicted_sortedR = test_prediction_random_df.sort(['Predictions'])
# bottom_predicted_sortedR = predicted_sortedR.tail(20)

# 
# 
# test_prediction_rearranged = crf.predict(X_test_rearranged)
# test_prediction_rearranged_df = pd.DataFrame(test_prediction_rearranged,columns=['Predictions'])
# 
# testing_predictions_rearranged = testing.merge(test_prediction_rearranged_df,left_index=True,right_index=True)
# 
# 
# predicted_sortedR = testing_predictions_rearranged.sort(['Predictions'])
# top_predicted_sortedR = predicted_sortedR.head(20)
# bottom_predicted_sortedR = predicted_sortedR.tail(20)
# 
# truth_sortedR = testing_predictions_rearranged.sort(['mpd'])
# top_truth_sortedR = truth_sortedR.head(20)
# bottom_truth_sortedR = truth_sortedR.tail(20)
# 
# c = pd.merge(top_predicted_sortedR,top_truth_sortedR,on='ProfileURL')
# numerator = len(c)
# numfloat = np.float(numerator)
# accuracyTopR = (numfloat/20)*100
# # 22.5
# # 50
# 
# d = pd.merge(bottom_predicted_sortedR,bottom_truth_sortedR,on='ProfileURL')
# numerator = len(d)
# numfloat = np.float(numerator)
# accuracyBottomR = (numfloat/20)*100
# # 47.5
# # 50
# 
# print accuracyTopR
# print accuracyBottomR

##################################################################


# test to see how well it worked!
# test = crf.predict(X_test) - Y_test
# test_random = crf.predict(X_test_rearranged) - Y_test
# 
# SEM = np.sqrt(np.mean(test**2))
# # 320
# 
# SEM_random = np.sqrt(np.mean(test_random**2))

# Y_test_HighBound5 = Y_test + (Y_test*.05)
# Y_test_LowBound5 = Y_test - (Y_test*.05)
# high_test5 = test_prediction < Y_test_HighBound5
# low_test5 = test_prediction > Y_test_LowBound5
# bound_test = high_test5 & low_test5
# sum5 = np.sum(bound_test)
# sum5 = sum5.astype('float')
# accuracy5 = ((sum5)/(len(Y_test)))*100
# print accuracy5
# 
# 
# Y_test_HighBound10 = Y_test + (Y_test*.1)
# Y_test_LowBound10 = Y_test - (Y_test*.1)
# high_test10 = test_prediction < Y_test_HighBound10
# low_test10 = test_prediction > Y_test_LowBound10
# bound_test = high_test10 & low_test10
# sum10 = np.sum(bound_test)
# sum10 = sum10.astype('float')
# accuracy10 = ((sum10)/(len(Y_test)))*100
# print accuracy10
# 
# 
# Y_test_HighBound20 = Y_test + (Y_test*.2)
# Y_test_LowBound20 = Y_test - (Y_test*.2)
# high_test20 = test_prediction < Y_test_HighBound20
# low_test20 = test_prediction > Y_test_LowBound20
# bound_test = high_test20 & low_test20
# sum20 = np.sum(bound_test)
# sum20 = sum20.astype('float')
# accuracy20 = ((sum20)/(len(Y_test)))*100
# print accuracy20
# 
# Y_test_HighBound50 = Y_test + (Y_test*.5)
# Y_test_LowBound50 = Y_test - (Y_test*.5)
# high_test50 = test_prediction < Y_test_HighBound50
# low_test50 = test_prediction > Y_test_LowBound50
# bound_test = high_test50 & low_test50
# sum50 = np.sum(bound_test)
# sum50 = sum50.astype('float')
# accuracy50 = ((sum50)/(len(Y_test)))*100
# print accuracy50
# 
# 
# Y_test_HighBoundSEM = Y_test + SEM
# Y_test_LowBoundSEM = Y_test - SEM
# high_testSEM = test_prediction < Y_test_HighBoundSEM
# low_testSEM = test_prediction > Y_test_LowBoundSEM
# bound_test = high_testSEM & low_testSEM
# sumSEM = np.sum(bound_test)
# sumSEM = sumSEM.astype('float')
# accuracySEM = ((sumSEM)/(len(Y_test)))*100
# print accuracySEM
# 
# 
# 

# 
# MSE=mean_squared_error(Y_test,crf.predict(X_test))
# # 6.56
# 
# plt.scatter(Y_test,crf.predict(X_test))
# plt.show()
# 
# 
# plt.scatter(Y_test,Y_test-crf.predict(X_test))
# plt.show()
# 
# plt.scatter(crf.predict(X_test),Y_test-crf.predict(X_test))
# plt.show()
# 
# 
# plotting_names = np.array(('Cost_y', 'Age', 'medical_facility',  'mo_num',  'continent_num', 'cLen', 'day_num'))
# 
# #print crf.feature_importances_
# indices = np.argsort(crf.feature_importances_)[::-1][:numfeat]
# plt.bar(xrange(numfeat), crf.feature_importances_[indices],align='center', alpha=.5)
# plt.xticks(xrange(numfeat), plotting_names[indices],rotation='horizontal', fontsize=12)
# plt.xlim([-1, numfeat])
# plt.ylabel('Feature importances', fontsize=24)
# plt.title('', fontsize=28)
# plt.show()

# 

##################################################################
###linear model

# from sklearn import linear_model
# clf = linear_model.LinearRegression()
# 
# 
# clf.fit(X_train, Y_train)
# 
# clf.score(X_train, Y_train)
# # 0.30
# 
# clf.score(X_test, Y_test)
# # 0.27
# 
# 
# 
# test_prediction = clf.predict(X_test)
# 
# 
# 
# Y_test_HighBound5 = Y_test + (Y_test*.05)
# Y_test_LowBound5 = Y_test - (Y_test*.05)
# high_test5 = test_prediction < Y_test_HighBound5
# low_test5 = test_prediction > Y_test_LowBound5
# bound_test = high_test5 & low_test5
# sum5 = np.sum(bound_test)
# sum5 = sum5.astype('float')
# accuracy5 = ((sum5)/(len(Y_test)))*100
# print accuracy5
# 
# 
# Y_test_HighBound10 = Y_test + (Y_test*.1)
# Y_test_LowBound10 = Y_test - (Y_test*.1)
# high_test10 = test_prediction < Y_test_HighBound10
# low_test10 = test_prediction > Y_test_LowBound10
# bound_test = high_test10 & low_test10
# sum10 = np.sum(bound_test)
# sum10 = sum10.astype('float')
# accuracy10 = ((sum10)/(len(Y_test)))*100
# print accuracy10
# 
# 
# Y_test_HighBound20 = Y_test + (Y_test*.2)
# Y_test_LowBound20 = Y_test - (Y_test*.2)
# high_test20 = test_prediction < Y_test_HighBound20
# low_test20 = test_prediction > Y_test_LowBound20
# bound_test = high_test20 & low_test20
# sum20 = np.sum(bound_test)
# sum20 = sum20.astype('float')
# accuracy20 = ((sum20)/(len(Y_test)))*100
# print accuracy20
# 
# Y_test_HighBound50 = Y_test + (Y_test*.5)
# Y_test_LowBound50 = Y_test - (Y_test*.5)
# high_test50 = test_prediction < Y_test_HighBound50
# low_test50 = test_prediction > Y_test_LowBound50
# bound_test = high_test50 & low_test50
# sum50 = np.sum(bound_test)
# sum50 = sum50.astype('float')
# accuracy50 = ((sum50)/(len(Y_test)))*100
# print accuracy50
# 
# 
# Y_test_HighBoundSEM = Y_test + SEM
# Y_test_LowBoundSEM = Y_test - SEM
# high_testSEM = test_prediction < Y_test_HighBoundSEM
# low_testSEM = test_prediction > Y_test_LowBoundSEM
# bound_test = high_testSEM & low_testSEM
# sumSEM = np.sum(bound_test)
# sumSEM = sumSEM.astype('float')
# accuracySEM = ((sumSEM)/(len(Y_test)))*100
# print accuracySEM
# 
# 
# 
# 
# 
# 
# 
# 
# 
# # test to see how well it worked!
# test = clf.predict(X_test) - Y_test
# np.sqrt(np.mean(test**2))
# # 328.76
# 
# 
# 
# print 'coef array',clf.coef_
# print 'length', len(clf.coef_)
# print 'getting value 0:', clf.coef_[0]
# print 'getting value 1:', clf.coef_[1]

##################################################################
### Testing gradient boosting regression
# import numpy as np
# import pylab as pl
# from sklearn import ensemble
# from sklearn import datasets
# from sklearn.utils import shuffle
# from sklearn.metrics import mean_squared_error
# 
# X, y = shuffle(X_train, Y_train, random_state=13)
# X = X.astype(np.float32)
# offset = int(X.shape[0] * 0.9)
# X_train, y_train = X[:offset], y[:offset]
# X_test, y_test = X[offset:], y[offset:]
# 
# # Fit regression model
# params = {'n_estimators': 1000, 'max_depth': 4, 'min_samples_split': 1,'learning_rate': 0.01, 'loss': 'ls'}
# clf = ensemble.GradientBoostingRegressor(**params)
# 
# clf.fit(X_train, y_train)
# 
# clf.score(X_train, y_train)
# # 0.67
# 
# clf.score(X_test, y_test)
# # 0.23
# 
# 
# test_prediction = clf.predict(X_test)
# 
# 
# 
# y_test_HighBound5 = y_test + (y_test*.05)
# y_test_LowBound5 = y_test - (y_test*.05)
# high_test5 = test_prediction < y_test_HighBound5
# low_test5 = test_prediction > y_test_LowBound5
# bound_test = high_test5 & low_test5
# sum5 = np.sum(bound_test)
# sum5 = sum5.astype('float')
# accuracy5 = ((sum5)/(len(y_test)))*100
# print accuracy5
# 
# 
# y_test_HighBound10 = y_test + (y_test*.1)
# y_test_LowBound10 = y_test - (y_test*.1)
# high_test10 = test_prediction < y_test_HighBound10
# low_test10 = test_prediction > y_test_LowBound10
# bound_test = high_test10 & low_test10
# sum10 = np.sum(bound_test)
# sum10 = sum10.astype('float')
# accuracy10 = ((sum10)/(len(y_test)))*100
# print accuracy10
# 
# 
# y_test_HighBound20 = y_test + (y_test*.2)
# y_test_LowBound20 = y_test - (y_test*.2)
# high_test20 = test_prediction < y_test_HighBound20
# low_test20 = test_prediction > y_test_LowBound20
# bound_test = high_test20 & low_test20
# sum20 = np.sum(bound_test)
# sum20 = sum20.astype('float')
# accuracy20 = ((sum20)/(len(y_test)))*100
# print accuracy20
# 
# y_test_HighBound50 = y_test + (y_test*.5)
# y_test_LowBound50 = y_test - (y_test*.5)
# high_test50 = test_prediction < y_test_HighBound50
# low_test50 = test_prediction > y_test_LowBound50
# bound_test = high_test50 & low_test50
# sum50 = np.sum(bound_test)
# sum50 = sum50.astype('float')
# accuracy50 = ((sum50)/(len(y_test)))*100
# print accuracy50
# 
# 
# y_test_HighBoundSEM = y_test + SEM
# y_test_LowBoundSEM = y_test - SEM
# high_testSEM = test_prediction < y_test_HighBoundSEM
# low_testSEM = test_prediction > y_test_LowBoundSEM
# bound_test = high_testSEM & low_testSEM
# sumSEM = np.sum(bound_test)
# sumSEM = sumSEM.astype('float')
# accuracySEM = ((sumSEM)/(len(y_test)))*100
# print accuracySEM
# 
# 
# 
# 
# 
# 
# 
# 
# # test to see how well it worked!
# test = clf.predict(X_test) - Y_test
# np.sqrt(np.mean(test**2))
# 
# 
# # Plot training deviance
# 
# # compute test set deviance
# test_score = np.zeros((params['n_estimators'],), dtype=np.float64)
# 
# for i, y_pred in enumerate(clf.staged_decision_function(X_test)):
#     test_score[i] = clf.loss_(y_test, y_pred)
# 
# pl.figure(figsize=(12, 6))
# pl.subplot(1, 2, 1)
# pl.title('Deviance')
# pl.plot(np.arange(params['n_estimators']) + 1, clf.train_score_, 'b-', label='Training Set Deviance')
# pl.plot(np.arange(params['n_estimators']) + 1, test_score, 'r-',label='Test Set Deviance')
# pl.legend(loc='upper right')
# pl.xlabel('Boosting Iterations')
# pl.ylabel('Deviance')
# 
# # Plot feature importance
# feature_importance = clf.feature_importances_
# # make importances relative to max importance
# feature_importance = 100.0 * (feature_importance / feature_importance.max())
# sorted_idx = np.argsort(feature_importance)
# pos = np.arange(sorted_idx.shape[0]) + .5
# pl.subplot(1, 2, 2)
# pl.barh(pos, feature_importance[sorted_idx], align='center')
# pl.yticks(pos, boston.feature_names[sorted_idx])
# pl.xlabel('Relative Importance')
# pl.title('Variable Importance')
# pl.show()
# 
# ##################################################################
# ### Testing other models
# 
# import sklearn.linear_model
# import sklearn.svm
# from sklearn.neighbors import KNeighborsRegressor
# '''
# crf = sklearn.linear_model.LinearRegression()
# crf = sklearn.linear_model.Ridge(alphas=[0.1, 1.0, 10.0])
# crf = sklearn.linear_model.BayesianRidge()
# crf = sklearn.svm.SV()
# '''
# crf = KNeighborsRegressor()
# # cross-validate to figure out best parameters
# 
# #test = Y_test.mean() - Y_test
# #np.sqrt(np.mean(test**2))

###############################################################################

predictions = crf.predict(X_test)
# the above is the output that i want to feed back to the site

predictions_formatted = np.around(predictions,decimals=2)

predictions_df = pd.DataFrame(predictions_formatted,columns=['Predictions'])

d_test = d_test.reset_index()


TestSet_with_predictions = d_test.merge(predictions_df,left_index=True,right_index=True)


# the entire dataset, with prediction data, seen below:
pred_data = d.merge(TestSet_with_predictions,on='ProfileURL', how="outer")

#strength of features:
 
print crf.feature_importances_
# print clf.oob_score_ 
 
print crf.get_params() #


###############################################################################
###############################################################################
# upload to SQL database


#pert_cols = ['PatientID_x', 'PatientName_x_x', 'MedicalPartner_x_x', 'Age_x', 'Country_x_x' , 'region_num_x' , 'TimeToFunding_x' , 'ProfileURL', 'Cost_y_x', 'Predictions','gender_x','gender_num_x','Caption_x','cLen_x','weekday_posted_x','day_num_x','PicURL_x']

pert_cols = ['PatientID_x', 'PatientName_x_x', 'MedicalPartner_x_x', 'Age_x', 'Country_x_x' , 'region_num_x' , 'TimeToFunding_x' , 'ProfileURL', 'Cost_y_x', 'Predictions','Caption_x','cLen_x','weekday_posted_x','day_num_x','PicURL_x']

cc = pred_data[pert_cols]
 
cc = cc.where((pd.notnull(cc)),None)

 
def create_db(host, user):

    con = pymysql.connect(host='localhost', user='root')
    cur = con.cursor()
    cur.execute('''DROP DATABASE if exists watsi;''')
    cur.execute('''CREATE DATABASE watsi;''')
    cur.execute('''USE watsi;''')
    cur.execute('''CREATE TABLE patients (
                     PatientID INT NOT NULL,
                     PatientName TEXT,
                     MedicalPartner TEXT,
                     Age int,
                     Country TEXT,
                     CountryNum int NOT NULL,
                     TimeToFunding TEXT,
                     ProfileURL TEXT,
                     Cost int NOT NULL,
                     Predictions TEXT,
                     Caption TEXT,
                     CaptionLength int NOT NULL,
                     WeekdayPosted TEXT,
                     WeekdayNum int NOT NULL,
                     PicURL TEXT,
                     PRIMARY KEY (PatientID)
                      
                   );''')


def insertdata_db(host, user):
     
    con = pymysql.connect(host='localhost', user='root',database='watsi')
    cur = con.cursor()
     
    for irow in xrange(len(cc)):
        row = cc.iloc[irow]
        print irow, row
        insertable_row = list(row)
        insertable_row[0] = int(insertable_row[0])
        insertable_row[3] = int(insertable_row[3])
        insertable_row[5] = int(insertable_row[5])
        #insertable_row[6] = float(insertable_row[6])
        insertable_row[8] = int(insertable_row[8])
        insertable_row[11] = int(insertable_row[11])
        insertable_row[13] = int(insertable_row[13])
       
         
        cur.execute('''INSERT INTO patients (PatientID,
        PatientName, MedicalPartner, Age, Country, CountryNum, TimeToFunding, ProfileURL, Cost, Predictions, Caption, CaptionLength, WeekdayPosted, WeekdayNum, PicURL)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''', insertable_row) 
                       
    cur.close()
    con.commit()
    con.close()

 
def query_db(host, user):


    con = pymysql.connect(host='localhost', user='root',database='watsi')
    cur = con.cursor()
    
    cur.execute('''SELECT * FROM patients''')
    for i in cur:
        print i
     
    cur.close()
    con.close()
 
create_db('localhost', 'root')
insertdata_db('localhost', 'root')
query_db('localhost', 'root')





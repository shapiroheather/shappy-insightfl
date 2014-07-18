###############################################################################

## import what i need

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

from sklearn.ensemble import RandomForestRegressor
from sklearn.ensemble import RandomForestClassifier
from sklearn import cross_validation
from sklearn.cross_validation import cross_val_score
from sklearn import grid_search
from sklearn import metrics


###############################################################################

## data pre-processing

# read in the data

a = pd.read_csv('/Users/heathershapiro/Documents/My_Docs/INSIGHT/watsi_project/Watsi_transparency_edited_v4.csv')
b = pd.read_csv('/Users/heathershapiro/Documents/My_Docs/INSIGHT/watsi_project/scraped_data_v7.csv')

# merge the data

d = a.merge(b,on='ProfileURL')

# some brief clean-up...

d = d[d.Cost_y <= 2000]

# get ready for random forest (make a few data alterations)

def prepare_data_for_RF(d):
    
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
        
    return d

d = prepare_data_for_RF(d)

###############################################################################

## eliminate TimeToFunding rows that have missing values 
# (i.e. those that have not yet been funded)

d_train = d.dropna(subset=['TimeToFunding'])
d_train = d_train[d_train.TimeToFunding <=20]

d_train['Age'] = d_train['Age'].astype(np.float64)
d_train['Cost_y'] = d_train['Cost_y'].astype(np.float64)

d_train['mpd'] = d_train.Cost_y/d_train.TimeToFunding

d_train = d_train.reset_index()

for irow in xrange(len(d_train.mpd)):
    if np.isinf(d_train.mpd[irow]):
        d_train.mpd[irow] = d_train.Cost_y[irow]
    else:
        d_train.mpd[irow] = d_train.mpd[irow]
        
d_test = d[pd.isnull(d['TimeToFunding'])==True]

###############################################################################

## run random forest
    
predictors = ['Cost_y', 'Age', 'medical_facility','mo_num',  'continent_num', 'cLen', 'day_num']

numfeat = len(predictors)
 
testing = d_train[0:1910:5]

keep = testing['PatientID']
training = d_train[~d_train['PatientID'].isin(keep)]

# below is training on a subset of participants:    

Y_train = training.mpd # variable to predict
X_train = training[predictors]

# testing set!

X_test = d_test[predictors]

###

# build "best" random forest model

nfolds = 5 #number of folds to use for cross-validation
parameters = {'n_estimators':[10,100,1000],  'max_features':[3,5,7]}
njobs = 1 #number of jobs to run in parallel
rf_tune = grid_search.GridSearchCV(RandomForestRegressor(), parameters, n_jobs = njobs, cv = nfolds)
rf_opt = rf_tune.fit(X_train,Y_train)
    
# results of the grid search for optimal random forest parameters

print("Grid of scores:\n" + str(rf_opt.grid_scores_) + "\n")
print("Best zero-one score: " + str(rf_opt.best_score_) + "\n")
print("Optimal Model:\n" + str(rf_opt.best_estimator_) + "\n")
print "Parameters of random forest:\n " , rf_opt.get_params()
 
# now use the optimal model's parameters to run random forest

crf = RandomForestRegressor(n_estimators=1000, max_features=3, random_state=33, max_depth=5) 

print "Parameters used in chosen RF model:\n " , crf.get_params()

crf.fit(X_train, Y_train)

crf.score(X_train, Y_train)

###############################################################################

## below is the output that i want to feed back to the site

predictions = crf.predict(X_test)

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

## upload to SQL database

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
from flask import render_template, url_for, request, redirect
from app import app, host, port, user, passwd, db
from app.helpers.database import con_db

import pymysql


import json
import pdb

# To create a database connection, add the following
# within your view functions:
# con = con_db(host, port, user, passwd, db)

# setting up SQL search
def fetch_record(query):
    db = pymysql.connect(host='localhost', user='root',database='watsi')
    with db:
        cur = db.cursor(pymysql.cursors.DictCursor)
        cur.execute(query)
        tables = cur.fetchall()
        return tables


# ROUTING/VIEW FUNCTIONS
@app.route('/')
def search():
    return render_template('index.html')
    

@app.route('/results')
def showresults(): 

    #con = con_db(host, port, user, passwd, db)
    
    #extract the input
    url = request.args['PatientURL']
    
    #convert the input to a list
    url_str = str(url)
    url_list = url_str.split(",")
    print url_list
    print url_list[0]

    
    
     
    
    # process the data:
         
#     Y_train = fetch_record('SELECT TimeToFunding FROM patients WHERE TimeToFunding IS NOT NULL')
#     X_train = fetch_record('SELECT Age, CountryNum, Cost FROM patients WHERE TimeToFunding IS NOT NULL')
#         
#         clf = RandomForestClassifier(n_estimators=1000, random_state=33) # creates object to store parameters
#         # cross-validate to figure out best parameters
#         
#         clf.fit(X_train, Y_train)     
#         
#         Y_test = clf.predict(data)
#         
#         # add data to the dictionary
#         predictions["data"] = Y_test
#         
#         return render_template('output.html', data=data)
#         # Data is now accessible in template: {{data['key']}}
                      
    #return render_template('output.html', data=data, PatientName=PatientName, Age=Age, Cost=Cost, Gender=Gender, Caption=Caption, Country=Country, CountryNum=CountryNum, Photo_str = Photo_str, ProfileURL_str=ProfileURL_str)
    
    print url_list
    print type(url_list)
    print url_list[0]
    
    if len(url_list)==6:
        data_list = []
        for irow in xrange(len(url_list)):
            data_list.append(fetch_record('SELECT Predictions, PatientName, Age, Gender, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % url_list[irow]))        
        
        
        sorted_list = sorted(data_list, key=lambda k: k[0]['Predictions'])
        
        return render_template('multi_output6.html', sorted_list=sorted_list)        

    elif len(url_list)==5:
        data_list = []
        for irow in xrange(len(url_list)):
            data_list.append(fetch_record('SELECT Predictions, PatientName, Age, Gender, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % url_list[irow]))        
        
        
        sorted_list = sorted(data_list, key=lambda k: k[0]['Predictions'])
        
        return render_template('multi_output5.html', sorted_list=sorted_list)        

    elif len(url_list)==4:
        data_list = []
        for irow in xrange(len(url_list)):
            data_list.append(fetch_record('SELECT Predictions, PatientName, Age, Gender, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % url_list[irow]))        
        
        
        sorted_list = sorted(data_list, key=lambda k: k[0]['Predictions'])
        
        return render_template('multi_output4.html', sorted_list=sorted_list)        


 
    elif len(url_list)==3:
        data_list = []
        for irow in xrange(len(url_list)):
            data_list.append(fetch_record('SELECT Predictions, PatientName, Age, Gender, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % url_list[irow]))        
        
        
        sorted_list = sorted(data_list, key=lambda k: k[0]['Predictions'])
        
        return render_template('multi_output3.html', sorted_list=sorted_list)        


    elif len(url_list)==2:
        data_list = []
        for irow in xrange(len(url_list)):
            data_list.append(fetch_record('SELECT Predictions, PatientName, Age, Gender, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % url_list[irow]))        
        
        
        sorted_list = sorted(data_list, key=lambda k: k[0]['Predictions'])
        
        return render_template('multi_output.html', sorted_list=sorted_list)        

            
    else:
        data = fetch_record('SELECT Predictions, PatientName, Age, Gender, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % url)    
       
        ProfileURL_str = str(data[0]['ProfileURL'])
        Photo_str = str(data[0]['PicURL'])
        return render_template('output.html', data=data, Photo_str=Photo_str, ProfileURL_str = ProfileURL_str)



@app.route('/index')
def index():
    # Renders index.html.
    return render_template('index.html')

@app.route("/search.html")
#def search():
    
    
@app.route('/home')
def home():
    # Renders home.html.
    return render_template('home.html')

@app.route('/slides')
def about():
    # Renders slides.html.
    return render_template('slides.html')

@app.route('/author')
def contact():
    # Renders author.html.
    return render_template('author.html')

@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

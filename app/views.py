from flask import render_template, url_for, request, redirect
from app import app, host, port, user, passwd, db
from app.helpers.database import con_db

import pymysql
import json
import pdb

# Set up SQL search
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
    
@app.route('/results/<patient_id>')
def showresults(patient_id): 
   
    #extract the input
    #url = request.args['PatientURL']
    
    #convert the input to a list
    #url_str = str(url)
    #url_list = url_str.split(",")
    
    id_list = ['2241','2257','2258','2299','2297','2307','2316','2345','2377'] 
    
   #  if len(url_list)>1:
#         data_list = []
#         for irow in xrange(len(url_list)):
#             data_list.append(fetch_record('SELECT Predictions, PatientName, Age, Gender, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % url_list[irow]))        
#                
#         sorted_list = sorted(data_list, key=lambda k: k[0]['Predictions'], reverse=True)
#         
#         return render_template('multi_output5.html', sorted_list=sorted_list)        
#             
#     else:
#         data = fetch_record('SELECT Predictions, PatientName, Age, Gender, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % url)    
#        
#         ProfileURL_str = str(data[0]['ProfileURL'])
#         Photo_str = str(data[0]['PicURL'])
#         return render_template('output.html', data=data, Photo_str=Photo_str, ProfileURL_str = ProfileURL_str)


    if patient_id=='Select All':
        data_list = []
        for irow in xrange(len(id_list)):
            data_list.append(fetch_record('SELECT Predictions, PatientName, Age, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % id_list[irow]))        
               
        sorted_list = sorted(data_list, key=lambda k: k[0]['Predictions'], reverse=True)
        
        return render_template('multi_output5.html', sorted_list=sorted_list)        
            
    else:
        data = fetch_record('SELECT Predictions, PatientName, Age, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % patient_id)    
       
        ProfileURL_str = str(data[0]['ProfileURL'])
        Photo_str = str(data[0]['PicURL'])
        return render_template('output.html', data=data, Photo_str=Photo_str, ProfileURL_str = ProfileURL_str)

@app.route('/index')
def index():
    # Renders index.html.
    return render_template('index.html')
    
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

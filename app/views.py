from flask import render_template, url_for, request, redirect
from app import app, host, port, user, passwd, db
from app.helpers.database import con_db

import pymysql
import json
import pdb

# Set up SQL search
def fetch_record(query):
    con = pymysql.connect(host=host, user=user,database=db, passwd=passwd)
    with con:
        cur = con.cursor(pymysql.cursors.DictCursor)
        cur.execute(query)
        tables = cur.fetchall()
        return tables

# ROUTING/VIEW FUNCTIONS
@app.route('/')
def search():
    return render_template('index.html')
    
@app.route('/results/<patient_id>')
def showresults(patient_id): 
   
    new_list = ['2232','2241','2299','2307','2345','2377','3000','3001','3002','3003','3004','3005'] 
    
    if patient_id=='Select All':
        new_data_list = []
        for irow in xrange(len(new_list)):
            new_data_list.append(fetch_record('SELECT Predictions, PatientName, Age, Cost, Caption, Country, CountryNum, PicURL, ProfileURL FROM patients WHERE PatientID="%s";' % new_list[irow]))        
               
        sorted_list = sorted(new_data_list, key=lambda k: k[0]['Predictions'], reverse=True)
        
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

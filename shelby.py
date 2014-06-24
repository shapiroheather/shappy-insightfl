# to set up the virtual environment:

sudo pip install virtualenv
virtualenv venv

source ven/bin/activate # this tells you to go to your virtual environment

python server.py


# Deploying to AWS:

scp -i insight.pem /Users/heathershapiro/Documents/My_Docs/INSIGHT/shappy-insightfl/deployment/setup.sh ubuntu@ec2-54-213-90-126.us-west-2.compute.amazonaws.com:~

ssh -i insight.pem ubuntu@ec2-54-213-90-126.us-west-2.compute.amazonaws.com
# !/bin/sh
python3 manage.py runserver 0.0.0.0:8000
sleep 1;
# pwd >> /logs.txt
# ls -l / >> /logs.txt
# ls -l /code >> /logs.txt
python3 manage.py migrate >> /logs.txt

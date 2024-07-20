#!/bin/sh
#python manage.py makemigrations # we only need migration files for  deployment if there's persistent data we want to keep after reboots of the project
python manage.py migrate
exec python manage.py runserver 0.0.0.0:8000

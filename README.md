Dans le cas ou ca ne fonctionne plus :

django : Dockerfile :
commenter :
	ENTRYPOINT [ "bash", "/run_me.sh" ]

docker-compose.yml :
de commenter :
    # command: python3 manage.py runserver 0.0.0.0:8000

Makefile :
de commenter :
		# sudo docker compose -f srcs/docker-compose.yml run web django-admin startproject djangodepot .

	# sudo rm -rf ./srcs/requirements/django/data

	# sudo rm -rf ./srcs/requirements/postgresql/data


Lancer :
	sudo make re

Makefile :
commenter :
		# sudo docker compose -f srcs/docker-compose.yml run web django-admin startproject djangodepot .

	# sudo rm -rf ./srcs/requirements/django/data

	# sudo rm -rf ./srcs/requirements/postgresql/data

django : data : djangodepot : settings.py :

sous :
	from pathlib import Path
ajouter :
	import os

remplacer :

DATABASES = { tout le bloc par }

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_NAME'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': 'db',
        'PORT': 5432,
    }
}


lancer :
	sudo make re


docker-compose.yml :
commenter :
    # command: python3 manage.py runserver 0.0.0.0:8000

django : Dockerfile :
de commenter :
	ENTRYPOINT [ "bash", "/run_me.sh" ]


Bon courage, bisous	


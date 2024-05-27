USER_HOME = /home/guderram
USER = guderram


all:
	sudo rm -rf ./srcs/requirements/postgresql/data
	sudo mkdir -p ./srcs/requirements/django/data
	sudo mkdir -p ./srcs/requirements/postgresql/data
	# sudo docker compose -f srcs/docker-compose.yml run web django-admin startproject djangodepot .
	# sudo chown -R $(USER):$(USER) ./srcs/requirements/django/data/composeexample ./srcs/requirements/django/data/manage.py
	sudo docker compose -f srcs/docker-compose.yml up -d
	
down:
	sudo docker compose -f srcs/docker-compose.yml down

up:
	sudo docker compose -f srcs/docker-compose.yml up -d

clean:
	docker compose -f srcs/docker-compose.yml down -v
	docker rmi $$(docker images -q)
	# sudo rm -rf ./srcs/requirements/django/data
	sudo rm -rf ./srcs/requirements/postgresql/data

fclean: clean
	docker system prune -af

rere: fclean all

re: clean all

gitmoica : 
	sudo chmod -R +rx ./srcs/requirements/postgresql/data
	git add .
	git status
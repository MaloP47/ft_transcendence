USER_HOME = /home/guderram
USER = guderram


all:
	sudo mkdir -p ./srcs/requirements/django/data
	sudo mkdir -p ./srcs/requirements/postgresql/data
	sudo docker compose -f srcs/docker-compose.yml run web django-admin startproject composeexample .
	# sudo chown -R $(USER):$(USER) ./srcs/requirements/django/data/composeexample ./srcs/requirements/django/data/manage.py
	sudo docker compose -f srcs/docker-compose.yml up
	
down:
	sudo docker compose -f srcs/docker-compose.yml down

up:
	sudo docker compose -f srcs/docker-compose.yml up

clean:
	docker-compose -f srcs/docker-compose.yml down -v
	docker rmi $$(docker images -q)
	sudo rm -rf ./srcs/requirements/django/data
	sudo rm -rf ./srcs/requirements/postgresql/data

fclean: clean
	docker system prune -af

rere: fclean all

re: clean all
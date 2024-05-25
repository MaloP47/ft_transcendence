USER_HOME = /home/guderram
USER = guderram


all:
	sudo docker compose run web django-admin startproject composeexample .
	sudo chown -R $(USER):$(USER) composeexample manage.py
	sudo docker compose up
	
down:
	sudo docker compose down

up:
	sudo docker compose up

clean:
	docker-compose down -v
	docker rmi $$(docker images -q)
	rm -rf ./data
	rm -rf ./composeexample
	rm -rf ./manage.py

fclean: clean
	docker system prune -af

rere: fclean all

re: clean all
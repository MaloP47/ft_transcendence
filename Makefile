# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: guderram <guderram@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/28 10:17:29 by gbrunet           #+#    #+#              #
#    Updated: 2024/06/13 18:10:46 by guderram         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

_BLACK = \033[0;30m
_RED = \033[0;31m
_GREEN = \033[0;32m
_BLUE = \033[0;34m
_YELLOW = \033[0;33m
_PURPLE = \033[0;35m
_CYAN = \033[0;36m
_WHITE = \033[0;37m

_BOLD = \e[1m
_THIN = \e[2m

_END = \033[0m

.PHONY : all stop re clean

all:
	@echo "$(_GREEN)Building and running Transcendence...$(_END)"
	docker compose -f ./srcs/docker-compose.yml up -d --build
	sleep 2;
	make makemigrations --no-print-directory
	sleep 2;
	make migrate --no-print-directory

stop:
	@echo "$(_YELLOW)Stoping Transcendence...$(_END)"
	docker compose -f ./srcs/docker-compose.yml down

clean:
	make stop --no-print-directory
	@echo "$(_YELLOW)Removing all unused containers...$(_END)"
	docker system prune -f
	docker volume prune -f


fclean:
	make stop --no-print-directory
	@echo "$(_YELLOW)Removing all unused containers...$(_END)"
	docker system prune -af
	docker volume prune -af

migrate:
	docker compose -f ./srcs/docker-compose.yml exec django python manage.py migrate

makemigrations:
	docker compose -f ./srcs/docker-compose.yml exec django python manage.py makemigrations website
	docker compose -f ./srcs/docker-compose.yml exec django python manage.py makemigrations chat

createsuperuser:
	docker compose -f ./srcs/docker-compose.yml exec django python manage.py createsuperuser

list:
	@docker ps

help:
	@echo "$(_CYAN)make / make all       $(_THIN)=> build and run transcendence$(_END)"
	@echo "$(_CYAN)make stop             $(_THIN)=> stop transcendence$(_END)"
	@echo "$(_CYAN)make clean            $(_THIN)=> $(_RED)WARNING$(_CYAN) $(_THIN)stop transcendence and remove ALL containers and volumes$(_END)"
	@echo "$(_CYAN)make list             $(_THIN)=> list all running container$(_END)"
	@echo "$(_CYAN)make migrate          $(_THIN)=> migrate db for django$(_END)"
	@echo "$(_CYAN)make createsuperuser  $(_THIN)=> create a superuser for django$(_END)"

re:
	make clean --no-print-directory
	make all --no-print-directory

rere:
	make fclean --no-print-directory
	make all --no-print-directory

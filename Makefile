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

### Formatting ###
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

ifndef VERBOSE
	MAKEFLAGS += --no-print-directory
endif
### Formatting ###

.PHONY : all up stop clean flcean migrate makemigrations craetesuperuser list help re rere

all up:
	@printf "$(_GREEN)Building and running Transcendence...$(_END)\n"
	docker compose up -d --build
	sleep 2;
	make makemigrations
	# Needing to make migrations like this probably makes project invalid
	# because of the "start project with only `docker compose up` rule
	# from evaluation sheet
	# Look into moving this inside a Dockerfile
	sleep 2;
	make migrate
	# same here

down:
	@printf "$(_YELLOW)Stopping Transcendence...$(_END)\n"
	docker compose down

clean: down
	@printf "$(_YELLOW)Removing all unused containers...$(_END)\n"
	docker system prune -f
	docker volume prune -f
	# Look into docker compose system cleaning functions instead of docker alone


fclean: down
	@printf "$(_YELLOW)Removing all unused containers...$(_END)\n"
	docker system prune -af
	docker volume prune -af
	# same here as in 'clean'

migrate:
	docker compose exec django python manage.py migrate

makemigrations:
	docker compose exec django python manage.py makemigrations website
	docker compose exec django python manage.py makemigrations chat

createsuperuser:
	docker compose exec django python manage.py createsuperuser

list:
	@docker compose ps -a

help:
	@printf "$(_CYAN)make / make all       $(_THIN)=> build and run transcendence$(_END)\n"
	@printf "$(_CYAN)make down             $(_THIN)=> stop transcendence$(_END)\n"
	@printf "$(_CYAN)make clean            $(_THIN)=> $(_RED)WARNING$(_CYAN) $(_THIN)stop transcendence and remove ALL containers and volumes$(_END)\n"
	@printf "$(_CYAN)make list             $(_THIN)=> list all running container$(_END)\n"
	@printf "$(_CYAN)make migrate          $(_THIN)=> migrate db for django$(_END)\n"
	@printf "$(_CYAN)make createsuperuser  $(_THIN)=> create a superuser for django$(_END)\n"

re: clean all

rere: fclean all

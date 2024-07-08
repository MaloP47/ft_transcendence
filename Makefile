# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: guderram <guderram@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/28 10:17:29 by gbrunet           #+#    #+#              #
#    Updated: 2024/07/08 13:33:59 by guderram         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

### Formatting ###
# Colors
_BLACK	= \033[30m
_RED	= \033[31m
_GREEN	= \033[32m
_BLUE	= \033[34m
_YELLOW	= \033[33m
_PURPLE	= \033[35m
_CYAN	= \033[36m
_WHITE	= \033[37m
_GREY	= \033[90m

# Style
_BOLD	= \033[1m
_THIN	= \033[2m
_ITALIC	= \033[3m
_UNDER	= \033[4m
_INVERT	= \033[7m

# Reset
_END	= \033[0m

ifndef VERBOSE
	MAKEFLAGS += --no-print-directory
endif
### Formatting ###

.PHONY : all up down stop clean flcean mkdirs migrate makemigrations craetesuperuser list help re rere

all up: mkdirs
	@printf "$(_GREEN)Building and running Transcendence...$(_END)\n"
	docker compose up -d --build
	# remove migrations from here
	# leave rules in makefile though, it's useful
	sleep 2;
	make makemigrations
	sleep 2;
	make migrate

down stop:
	@printf "$(_YELLOW)Stoping Transcendence...$(_END)\n"
	docker compose down

clean: down
	@printf "$(_YELLOW)Removing all unused containers...$(_END)\n"
	docker system prune -f
	docker volume prune -f
	rm -rf data/var-log
	rm -rf services/postgres/logs
	rm -rf data/kibana


fclean: down
	@printf "$(_YELLOW)Removing all unused containers...$(_END)\n"
	docker system prune -af
	docker volume prune -af
	rm -rf data/var-log
	rm -rf services/postgres/logs
	rm -rf data/kibana


mkdirs:
	@# temporary!!! remove later 
	@mkdir -p	data/var-log \
				data/var-log/django \
				data/var-log/nginx \
				data/var-log/postgresql \
				data/var-log/rabbitmq \
				services/postgres/logs \
				data/kibana
	@chmod 777 services/postgres/logs

migrate:
	docker compose exec django python manage.py migrate

makemigrations:
	docker compose exec django python manage.py makemigrations website
	docker compose exec django python manage.py makemigrations chat

createsuperuser:
	docker compose exec django python manage.py createsuperuser

list:
	@docker ps -a

help:
	@printf "$(_CYAN)make / make all        $(_ITALIC)$(_THIN)=> build and run transcendence$(_END)\n"
	@printf "$(_CYAN)make stop              $(_ITALIC)$(_THIN)=> stop transcendence$(_END)\n"
	@printf "$(_CYAN)make clean             $(_ITALIC)$(_THIN)=> $(_RED)WARNING!$(_CYAN) $(_THIN)stop transcendence and remove ALL containers and volumes$(_END)\n"
	@printf "$(_CYAN)make fclean            $(_ITALIC)$(_THIN)=> $(_RED)WARNING!$(_CYAN) $(_THIN)stop transcendence and remove ALL containers and volumes$(_END)\n"
	@printf "$(_CYAN)make list              $(_ITALIC)$(_THIN)=> list all running container$(_END)\n"
	@printf "$(_CYAN)make migrate           $(_ITALIC)$(_THIN)=> migrate db for django$(_END)\n"
	@printf "$(_CYAN)make createsuperuser   $(_ITALIC)$(_THIN)=> create a superuser for django$(_END)\n"

re: clean all

rere: fclean all

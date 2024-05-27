# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 11:24:15 by gbrunet           #+#    #+#              #
#    Updated: 2024/05/27 11:25:43 by gbrunet          ###   ########.fr        #
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
	make info --no-print-directory
	@echo "$(_GREEN)Building and running Transcendence...$(_END)"
	docker compose -f ./srcs/docker-compose.yml up -d --build

stop:
	@echo "$(_YELLOW)Stoping Transcendence...$(_END)"
	docker compose -f ./srcs/docker-compose.yml down

clean:
	make stop --no-print-directory
	@echo "$(_YELLOW)Removing all unused containers...$(_END)"
	docker system prune -f

re:
	make clean --no-print-directory
	make all --no-print-directory

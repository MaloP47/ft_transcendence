_RED = \033[0;31m
_GREEN = \033[0;32m
_BLUE = \033[0;34m
_YELLOW = \033[0;33m
_MAGENTA = \033[0;35m
_CYAN = \033[0;36m
_END = \033[0m

NAME = pong

.PHONY : all clean re

all	: $(NAME)

bonus : $(NAME_BONUS)

$(NAME) :
	@npm i
	@npx vite

clean : 
	@$(RM) -rf node_modules package-lock.json

re :
	@make clean
	@make all

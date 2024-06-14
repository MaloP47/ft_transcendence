#!/usr/bin/env bash

# Took this from inception
# Not the correct variables!!!

required_vars=(
	"DOMAIN_NAME"
	"DB_NAME"
	"DB_USER"
	"DB_PASS"
	"DB_RPASS"
	"WP_TITLE"
	"WP_USER"
	"WP_PASS"
	"WP_EMAIL"
	"WP_REDIS_PASS"
	"FTP_USER"
	"FTP_PASS"
	"UK_USER"
	"UK_PASS"
	"UK_SITE_NAME"
	"UK_SITE_URL"
	"VOL_DB"
	"VOL_WP"
	"VOL_ADMINER"
	"VOL_RESUME"
	"VOL_REDIS"
	"VOL_KUMA"
)
missing_var='false'

if [ -z $1 ]; then
	printf "Usage: $0 </path/to/.env>\n"
	exit 1
fi

if [ -s $1 ]; then
	printf "Checking required .env variables...\n"
	export $(grep -v "^\s*#" $1 | xargs )
	for var in "${required_vars[@]}"; do
		if [ -z "${!var}" ]; then
			printf "\e[31mError:\e[0m $var is not set\n"
			missing_var='true'
		fi
	done
	if [ "$missing_var" = "true" ]; then
		exit 1
	fi
	printf "\e[32mAll required variables present!\e[0m\n"
else
	printf "\e[31mError:\e[0m env file empty\n"
	exit 1
fi

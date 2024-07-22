#!/bin/bash

hostname=$(hostname)

host_prefix=$(echo $hostname | awk -F "." '{ print $1 }')

url="https://$host_prefix:1443"

env_variable="DJANGO_HOSTNAME_CSRF_1=$url"

if grep -q "^DJANGO_HOSTNAME_CSRF_1=" .env; then
    sed -i "s|^DJANGO_HOSTNAME_CSRF_1=.*|$env_variable|" .env
else
    temp_file=$(mktemp)
    echo $env_variable > $temp_file
    cat .env >> $temp_file
    mv $temp_file .env
fi

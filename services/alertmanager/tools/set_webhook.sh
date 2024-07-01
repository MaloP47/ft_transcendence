#!/usr/bin/env sh

sed -i "s|<WEBHOOK_URL>|${WEBHOOK_URL}|g" /etc/alertmanager/alertmanager.yml

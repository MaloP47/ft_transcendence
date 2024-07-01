FROM prom/alertmanager

# Set up config and replace webhook
COPY --chown=nobody:nobody conf/alertmanager.yml /etc/alertmanager/alertmanager.yml
ARG WEBHOOK_URL
RUN sed -i "s|WEBHOOK_URL|${WEBHOOK_URL}|g" /etc/alertmanager/alertmanager.yml

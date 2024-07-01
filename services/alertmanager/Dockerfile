FROM prom/alertmanager:v0.27.0

# Install config
COPY --chown=nobody:nobody conf/alertmanager.yml /etc/alertmanager/alertmanager.yml
ARG WEBHOOK_URL
RUN sed -i "s|WEBHOOK_URL|${WEBHOOK_URL}|g" /etc/alertmanager/alertmanager.yml

ENTRYPOINT ["sleep", "infinity"]

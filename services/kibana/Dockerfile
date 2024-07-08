FROM docker.elastic.co/kibana/kibana:7.17.10

USER root

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y curl


COPY ./conf/import_dashboards.sh /usr/share/kibana/import_dashboards.sh
COPY ./conf/dashboard.ndjson /usr/share/kibana/dashboard.ndjson

RUN chmod +x /usr/share/kibana/import_dashboards.sh

# ENTRYPOINT ["/bin/bash", "-c", "/usr/share/kibana/bin/kibana --allow-root && /usr/share/kibana/import_dashboards.sh"]
ENTRYPOINT ["/bin/bash", "-c", "/usr/share/kibana/import_dashboards.sh"]


FROM kibana:7.17.22

USER root

# RUN sed -i 's|^mirrorlist=|#mirrorlist=|g' /etc/yum.repos.d/CentOS-*.repo
# RUN sed -i 's|^#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*.repo


RUN apt -y update
RUN apt -y upgrade
RUN apt install -y curl

# RUN apk update
# RUN apk add --no-cache curl


COPY ./conf/import_dashboards.sh /usr/share/kibana/import_dashboards.sh
COPY ./conf/dashboard.ndjson /usr/share/kibana/dashboard.ndjson

RUN chmod +x /usr/share/kibana/import_dashboards.sh

ENTRYPOINT ["/bin/bash", "-c", "/usr/share/kibana/import_dashboards.sh"]

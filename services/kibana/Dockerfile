
# FROM docker.elastic.co/kibana/kibana:7.12.1
FROM kibana:8.14.3


USER root


# RUN pacman -Syu --noconfirm
# RUN pacman -S --noconfirm curl

# RUN sed -i 's|^mirrorlist=|#mirrorlist=|g' /etc/yum.repos.d/CentOS-*.repo
# RUN sed -i 's|^#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*.repo

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y curl

# RUN yum -y update
# RUN yum -y upgrade
# RUN yum install -y curl

# RUN dnf -y update
# RUN dnf -y upgrade
# RUN dnf install -y curl
# RUN dnf clean all



COPY ./conf/import_dashboards.sh /usr/share/kibana/import_dashboards.sh
COPY ./conf/dashboard.ndjson /usr/share/kibana/dashboard.ndjson

RUN chmod +x /usr/share/kibana/import_dashboards.sh

# ENTRYPOINT ["/bin/bash", "-c", "/usr/share/kibana/bin/kibana --allow-root && /usr/share/kibana/import_dashboards.sh"]
ENTRYPOINT ["/bin/bash", "-c", "/usr/share/kibana/import_dashboards.sh"]

FROM docker.elastic.co/logstash/logstash:7.12.1

COPY  ./conf/logstash.yml /usr/share/logstash/config/logstash.yml
COPY ./conf/logstash.conf /usr/share/logstash/pipeline/logstash.conf

USER root

RUN chmod +x /usr/share/logstash/pipeline/logstash.conf
RUN chmod +x /usr/share/logstash/config/logstash.yml

USER logstash

ENTRYPOINT ["/usr/share/logstash/bin/logstash", "-f", "/usr/share/logstash/pipeline/logstash.conf"]
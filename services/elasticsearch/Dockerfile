FROM elasticsearch:7.17.22

USER root

COPY ./conf/init_elasticsearch.sh /usr/share/elasticsearch/init_elasticsearch.sh

RUN chmod +x /usr/share/elasticsearch/init_elasticsearch.sh

RUN chown elasticsearch:elasticsearch /usr/share/elasticsearch/init_elasticsearch.sh

USER elasticsearch

ENTRYPOINT [ "/usr/share/elasticsearch/init_elasticsearch.sh" ] 


FROM elasticsearch:7.12.1
# FROM elasticsearch:8.14.3


USER root

COPY ./conf/init_elasticsearch.sh /usr/share/elasticsearch/init_elasticsearch.sh

RUN chmod +x /usr/share/elasticsearch/init_elasticsearch.sh

RUN chown elasticsearch:elasticsearch /usr/share/elasticsearch/init_elasticsearch.sh

# RUN /usr/share/elasticsearch/init_elasticsearch.sh


USER elasticsearch

# RUN  /usr/share/elasticsearch/bin/elasticsearch


ENTRYPOINT [ "/usr/share/elasticsearch/init_elasticsearch.sh" ] 
# ENTRYPOINT ["/usr/share/elasticsearch/bin/elasticsearch"]

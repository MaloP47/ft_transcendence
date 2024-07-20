FROM postgres:alpine3.20

RUN mkdir -p /var/log/postgresql
RUN touch /var/log/postgresql/postgresql.log
RUN chmod 777 /var/log/postgresql
RUN chown -R postgres:postgres /var/log/postgresql

FROM postgres:alpine3.20

# Create directories for PostgreSQL data and logs
RUN mkdir -p /var/lib/postgresql/data /var/log/postgresql

# Change ownership to postgres user
RUN chown -R postgres:postgres /var/lib/postgresql/data /var/log/postgresql

# Change permissions
RUN chmod 700 /var/lib/postgresql/data /var/log/postgresql

# Switch to the postgres user
USER postgres

# Initialize the PostgreSQL data directory
RUN initdb -D /var/lib/postgresql/data

# Copying the configuration files
COPY conf/postgresql.conf /etc/postgresql/postgresql.conf
# COPY conf/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf

# Start postgres
ENTRYPOINT ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]

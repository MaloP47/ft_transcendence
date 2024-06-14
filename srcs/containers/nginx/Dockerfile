
# Image used from Dockerhub
FROM nginx:stable-alpine3.19-otel

# Updating sources
RUN apk update
RUN apk upgrade

# Dependencies
RUN apk add openssl

# TSL Setup
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -out /etc/nginx/ssl/inception.crt \
        -keyout /etc/nginx/ssl/inception.key -subj \
        "/C=FR/ST=IleDeFrance/L=Paris/O=42/OU=42/CN=guderram.42.fr/UID=guderram"

# nginx config setup
# Creating the user and group www-data only if they do not exist
RUN addgroup -S www-data || true && adduser -S www-data -G www-data || true
RUN mkdir -p /var/run/nginx
COPY conf/nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /var/www/html
RUN chmod 755 /var/www/html
RUN chown -R www-data:www-data /var/www/html

# Start nginx
ENTRYPOINT ["nginx", "-g", "daemon off;"]

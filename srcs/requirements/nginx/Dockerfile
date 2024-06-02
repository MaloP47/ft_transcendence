#Image used from Dockerhub
FROM nginx:latest

#Updating sources
RUN apt update -y && apt upgrade -y

#Dependencies
# RUN apt install nginx -y
RUN apt install openssl -y

#TSL Setup
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -out /etc/nginx/ssl/inception.crt \
        -keyout /etc/nginx/ssl/inception.key -subj \
        "/C=FR/ST=IleDeFrance/L=Paris/O=42/OU=42/CN=guderram.42.fr/UID=guderram"

#nginx config setup
RUN mkdir -p /var/run/nginx
COPY conf/nginx.conf /etc/nginx/nginx.conf
RUN chmod 755 /var/www/html
RUN chown -R www-data:www-data /var/www/html

#Start nginx
ENTRYPOINT ["nginx", "-g", "daemon off;"]
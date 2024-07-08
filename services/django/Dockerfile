FROM python:3.11-alpine3.20
# FROM python:3.11.5-slim-bullseye
# RUN apt update -y
# RUN apt install redis-server -y

RUN apk update
RUN apk add build-base
RUN apk add -u libffi-dev
RUN apk add redis

ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
WORKDIR /code
COPY ./app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./app .
RUN chmod +x ./django_init.sh

ENTRYPOINT ["/code/django_init.sh"]

# RUN service redis-server start
#CMD ["redis-server"]


# RUN redis-server

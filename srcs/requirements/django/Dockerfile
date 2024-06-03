FROM python:3.11.5-slim-bullseye
RUN apt update -y
RUN apt install redis-server -y

ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
WORKDIR /code
COPY ./app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./app .
RUN service redis-server start

# RUN redis-server

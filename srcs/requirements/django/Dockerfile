FROM debian:bullseye


# FROM python:3
RUN apt-get update
RUN apt install -y python3 python3-distutils libpq-dev gcc python3-dev
RUN apt-get install -y curl
# RUN apt install -y python3-pip
# RUN export PATH="$HOME/.local/bin:$PATH"


RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
RUN python3 get-pip.py

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# RUN python manage.py migrate
WORKDIR /code
COPY ./conf/requirements.txt /code/
RUN pip install -r requirements.txt
COPY ./data/ /code/
# WORKDIR /
# COPY ./conf/run_me.sh /run_me.sh
# RUN chmod +x /run_me.sh

# RUN touch /logs.txt
# RUN chmod 777 /logs.txt
# WORKDIR /code

# RUN pwd >> /logs.txt
# RUN ls -l / >> /logs.txt
# RUN ls -l /code >> /logs.txt

# ENTRYPOINT [ "bash", "/run_me.sh" ]

# CMD ["python3", "manage.py", "runserver"]

# ENTRYPOINT [ "bash", "/run_me.sh" ]

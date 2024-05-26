# syntax=docker/dockerfile:1
FROM python:3
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# RUN python manage.py migrate
WORKDIR /code
COPY ./conf/requirements.txt /code/
RUN pip install -r requirements.txt
COPY ./data/ /code/
# WORKDIR /
COPY ./conf/run_me.sh /run_me.sh
RUN chmod +x /run_me.sh
# WORKDIR /code

# ENTRYPOINT [ "bash", "/run_me.sh" ]

CMD ["python", "manage.py", "runserver"]
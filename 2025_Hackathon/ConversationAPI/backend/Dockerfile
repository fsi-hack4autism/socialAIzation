
FROM python:3.9


WORKDIR /backend


COPY ./requirements.txt /backend/requirements.txt


RUN pip install --no-cache-dir --upgrade -r /backend/requirements.txt


COPY ./app /backend/app


CMD ["fastapi", "run", "app/main.py", "--port", "80"]
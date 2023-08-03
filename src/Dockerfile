FROM python:3.11-slim-bookworm
WORKDIR /src

RUN apt update

RUN /usr/local/bin/python -m pip install --upgrade pip
COPY ./requirements.txt /src/requirements.txt
RUN pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir --upgrade -r /src/requirements.txt
COPY ./app /src/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]

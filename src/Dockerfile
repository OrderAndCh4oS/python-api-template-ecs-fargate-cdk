FROM python:3.11-slim-bookworm
WORKDIR /src

RUN apt update
RUN apt-get install -y git g++ make curl
RUN git clone --depth 1 --branch sf_16 https://github.com/official-stockfish/Stockfish.git

RUN cd Stockfish/src \
    && echo "arch:$( uname -m )" \
    && case $( uname -m ) in \
      x86_64) \
        make build ARCH=x86-64-modern \
      ;; \
      aarch64) \
        make build ARCH=armv8 \
      ;; \
      armv7l) \
        make build ARCH=armv7 \
      ;; \
      ppc64le) \
        make build ARCH=ppc-64 \
      ;; \
      *) \
        exit 1 \
      ;; \
    esac

RUN /usr/local/bin/python -m pip install --upgrade pip
COPY ./requirements.txt /src/requirements.txt
RUN pip install torch --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir --upgrade -r /src/requirements.txt
COPY ./app /src/app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]

FROM ubuntu:20.04

WORKDIR /app/hello-from-the-world/
COPY ./hello-from-the-world/app.nim .
COPY ./resource/keyfile /keyfile

RUN apt-get update && apt-get -y install wget tar xz-utils git gcc
RUN wget https://nim-lang.org/download/nim-1.6.0-linux_x64.tar.xz && tar xvf nim-1.6.0-linux_x64.tar.xz

RUN cd ./nim-1.6.0 && sh install.sh /usr/bin && cp ./bin/nimble /usr/bin/nimble
RUN nimble refresh && nimble install jester

RUN nim c --threads:on --opt:speed -d:release -d:ssl app.nim

CMD ["./app"]
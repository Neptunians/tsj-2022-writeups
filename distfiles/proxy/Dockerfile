FROM ubuntu:20.04

WORKDIR /ats
RUN apt-get update && apt-get install -y curl build-essential libssl-dev libpcre3-dev zlib1g-dev

RUN curl -L https://archive.apache.org/dist/trafficserver/trafficserver-9.1.0.tar.bz2 > ats.tar.bz2
RUN tar xf ats.tar.bz2 && cd trafficserver-9.1.0 && ./configure --prefix=/opt/ts && make install
COPY ./proxy/remap.config /opt/ts/etc/trafficserver/remap.config

CMD ["/opt/ts/bin/traffic_manager"]

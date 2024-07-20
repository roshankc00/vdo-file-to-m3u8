FROM ubuntu:focal

ENV DEBIAN_FRONTEND=noninteractive

RUN /usr/bin/apt-get update && \
    /usr/bin/apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    /usr/bin/apt-get update && \
    /usr/bin/apt-get upgrade -y && \
    /usr/bin/apt-get install -y nodejs ffmpeg dos2unix

WORKDIR /home/app

COPY main.sh .
COPY index.js .
COPY uploadtos3.js .
COPY pass.js .
COPY fail.js .
COPY removeFromPreviousBucket.js .
COPY package*.json .

COPY downloads /downloads
COPY output /output

RUN dos2unix main.sh && chmod +x main.sh
RUN dos2unix index.js && chmod +x index.js
RUN dos2unix uploadtos3.js && chmod +x uploadtos3.js
RUN dos2unix pass.js && chmod +x pass.js
RUN dos2unix fail.js && chmod +x fail.js

RUN chmod 777 /downloads && chmod 777 /output

RUN npm install

ENTRYPOINT ["/home/app/main.sh"]

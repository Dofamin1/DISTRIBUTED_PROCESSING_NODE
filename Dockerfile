FROM node:13.1-alpine

RUN apk --update add --no-cache git

WORKDIR app

RUN git clone https://github.com/Dofamin1/DISTRIBUTED_PROCESSING_NODE.git \
    && cd DISTRIBUTED_PROCESSING_NODE \
    && git checkout rework

WORKDIR DISTRIBUTED_PROCESSING_NODE

ENV FIRST_START_NODE_STATUS=STATUS \
    UUID=UUID \
    WS_HOST=HOST

RUN npm install
ENTRYPOINT LOGGER=true \
           FIRST_START_NODE_STATUS=$FIRST_START_NODE_STATUS \
           UUID=$UUID \
           WS_HOST=$WS_HOST \
           node ./index.js

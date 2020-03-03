FROM node:13.1-alpine

RUN apk --update add --no-cache git

RUN git clone https://github.com/Dofamin1/DISTRIBUTED_PROCESSING_NODE.git \
    && cd DISTRIBUTED_PROCESSING_NODE \
    && git checkout staging \
    && npm install \
    && npm run start_prod

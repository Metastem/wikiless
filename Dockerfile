#https://hub.docker.com/_/node/

FROM node:20-alpine3.17
RUN apk add git
RUN git clone https://github.com/Metastem/wikiless.git /wikiless
WORKDIR /wikiless
RUN apk add redis
RUN npm install --no-optional
COPY wikiless.config config.js
CMD npm start

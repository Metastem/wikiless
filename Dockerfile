FROM node:16-alpine
RUN apk add git
RUN git clone https://codeberg.org/orenom/Wikiless /wikiless
WORKDIR /wikiless
RUN npm install --no-optional
COPY config.js.template config.js
CMD npm start


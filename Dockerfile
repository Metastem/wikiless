FROM node:16-alpine
WORKDIR /wikiless
COPY . /wikiless
RUN npm install --no-optional
COPY config.js.template config.js
CMD npm start


FROM node:16-alpine

ADD ./ /app
WORKDIR /app
RUN npm install --no-optional
COPY config.js.template config.js
CMD npm start

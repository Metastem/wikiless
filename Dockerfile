FROM node:16-alpine
RUN apk add git
RUN git clone https://github.com/Metastem/wikiless.git /wikiless
WORKDIR /wikiless
RUN apk add redis
RUN npm install --no-optional
CMD npm start

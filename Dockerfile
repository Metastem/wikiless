#https://hub.docker.com/_/node/
FROM node:20-alpine3.17 AS build
WORKDIR /wikiless
COPY . /wikiless
RUN npm install --no-optional
FROM gcr.io/distroless/nodejs20-debian11
COPY --from=build /wikiless /wikiless
WORKDIR /wikiless
COPY wikiless.config config.js
CMD ["src/wikiless.js"]
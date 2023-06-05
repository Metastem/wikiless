FROM node:16-alpine AS build
WORKDIR /wikiless
COPY . /wikiless
RUN npm install --no-optional

FROM gcr.io/distroless/nodejs:16
COPY --from=build /wikiless /wikiless
WORKDIR /wikiless
COPY wikiless.config config.js
CMD ["src/wikiless.js"]

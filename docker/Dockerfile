FROM node:16.20.2-bookworm-slim as build-api
WORKDIR /wepublish
COPY . .
RUN npm ci && \
    npm install -g pkg && \
    npm run docker:build:api && \
    cp docker/api_build_package.json package.json && \
    pkg -C Brotli package.json

FROM node:16.20.2-bookworm-slim as build-editor
WORKDIR /wepublish
COPY . .
RUN npm ci && \
    npm install -g pkg && \
    npm run docker:build:editor && \
    cp docker/editor_build_package.json package.json && \
    pkg -C Brotli package.json

FROM debian:bookworm-slim as editor
MAINTAINER WePublish Foundation
ENV NODE_ENV=production
ENV ADDRESS=0.0.0.0
ENV PORT=3001
WORKDIR /wepublish
COPY --from=build-editor /wepublish/editor /wepublish
COPY --from=build-editor /wepublish/dist/apps/editor/browser dist/apps/editor/browser
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    chown -R wepublish:wepublish /wepublish
EXPOSE 3001
CMD /wepublish/editor

FROM debian:bookworm-slim as api
MAINTAINER WePublish Foundation
ENV NODE_ENV=production
ENV ADDRESS=0.0.0.0
ENV PORT=3000
WORKDIR /wepublish
COPY --from=build-api /wepublish/api /wepublish
COPY --from=build-api /wepublish/node_modules/bcrypt node_modules/bcrypt
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    chown -R wepublish:wepublish /wepublish
EXPOSE 3000
CMD /wepublish/api



#######
## API
#######

FROM node:18.19.1-bookworm-slim as build-api
WORKDIR /wepublish
COPY . .
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    npm ci && \
    npm install -g pkg && \
    npx nx build api-example && \
    cp docker/api_build_package.json package.json && \
    pkg -C Brotli package.json

FROM debian:bookworm-slim as api
MAINTAINER WePublish Foundation
ENV NODE_ENV=production
ENV ADDRESS=0.0.0.0
ENV PORT=4000
WORKDIR /wepublish
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    chown -R wepublish:wepublish /wepublish && \
    apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
COPY --chown=wepublish:wepublish apps/api-example/src/default.yaml /wepublish/config/default.yaml
COPY --chown=wepublish:wepublish --from=build-api /wepublish/api /wepublish
COPY --chown=wepublish:wepublish --from=build-api /wepublish/node_modules/bcrypt node_modules/bcrypt
EXPOSE 4000
USER wepublish
CMD /wepublish/api

#######
## Editor
#######

FROM node:18.19.1-bookworm-slim as build-editor
WORKDIR /wepublish
COPY . .
RUN npm ci && \
    npm install -g pkg && \
    npx nx build editor && \
    cp docker/editor_build_package.json package.json && \
    pkg -C Brotli package.json

FROM debian:bookworm-slim as editor
MAINTAINER WePublish Foundation
ENV NODE_ENV=production
ENV ADDRESS=0.0.0.0
ENV PORT=3000
WORKDIR /wepublish
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    chown -R wepublish:wepublish /wepublish
COPY --chown=wepublish:wepublish --from=build-editor /wepublish/editor /wepublish
COPY --chown=wepublish:wepublish --from=build-editor /wepublish/dist/apps/editor/browser dist/apps/editor/browser
EXPOSE 3000
USER wepublish
CMD /wepublish/editor

#######
## Migrations
#######
FROM node:18.19.1-bookworm-slim as build-migration
ENV NODE_ENV=production
WORKDIR /wepublish
COPY libs/settings/api/src/lib/setting.ts settings/api/src/lib/setting.ts
COPY libs/api/prisma/run-seed.ts api/prisma/run-seed.ts
COPY libs/api/prisma/seed.ts api/prisma/seed.ts
COPY docker/tsconfig.yaml_seed tsconfig.yaml
RUN npm install prisma @prisma/client @types/node bcrypt typescript && \
    npx tsc -p tsconfig.yaml

FROM node:18.19.1-bookworm-slim as migration
ENV NODE_ENV=production
MAINTAINER WePublish Foundation
WORKDIR /wepublish
COPY --from=build-migration /wepublish/dist ./dist
COPY libs/api/prisma/migrations prisma/migrations
COPY libs/api/prisma/schema.prisma prisma/schema.prisma
COPY docker/migrate_start.sh start.sh
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm install prisma bcrypt && \
    perl -i -0777 -pe 's/generator fabbrica \{\n  provider = "prisma-fabbrica"\n  output   = "\.\.\/\.\.\/testing\/src\/__generated__\/fabbrica"\n\}//gs' prisma/schema.prisma && \
    npx prisma generate \
USER wepublish
CMD ["bash", "./start.sh"]


#######
## Website
#######
FROM node:18.19.1-bookworm-slim as website
MAINTAINER WePublish Foundation
ENV ADDRESS=0.0.0.0
ENV PORT=4200
WORKDIR /wepublish
COPY . .
RUN npm ci
EXPOSE 4200
CMD ["npx", "nx", "serve", "website-example"]

######
## Storybook
######

FROM ghcr.io/wepublish/node:18.1 as dependencies
RUN apk update
USER node
RUN mkdir -p /home/node/wepublish
WORKDIR /home/node/wepublish
COPY --chown=node:node . .
RUN rm -rf .env
RUN npm ci

FROM dependencies as storybook-builder
RUN npx nx run website:build-storybook


FROM nginx:alpine as storybook
COPY --from=storybook-builder /home/node/wepublish/dist/storybook/website /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

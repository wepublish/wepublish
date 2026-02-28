ARG BUILD_IMAGE=node:22.20.0-bookworm-slim
ARG PLAIN_BUILD_IMAGE=node:22.20.0-bookworm-slim

#######
## Base Image
#######
FROM ${PLAIN_BUILD_IMAGE} AS base-image-build
WORKDIR /wepublish
COPY ./package.json .
COPY ./package-lock.json .
COPY ./.npmrc .
COPY ./build ./build
COPY ./libs/api/prisma/schema.prisma ./libs/api/prisma/schema.prisma

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm ci

FROM ${PLAIN_BUILD_IMAGE} AS base-image
LABEL org.opencontainers.image.authors="WePublish Foundation"
ENV NODE_ENV=production
WORKDIR /wepublish
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    chown -R wepublish:wepublish /wepublish
COPY --chown=wepublish:wepublish --from=base-image-build /wepublish/node_modules/ node_modules/

#######
## Website
#######

FROM ${BUILD_IMAGE} AS  build-website
### FRONT_ARG_REPLACER ###

COPY . .
RUN npx prisma generate && \
    npx nx build ${NEXT_PROJECT} ${NX_NEXT_PROJECT_BUILD_OPTIONS} && \
    bash /wepublish/deployment/map-secrets.sh clean

FROM ${PLAIN_BUILD_IMAGE} AS website
LABEL org.opencontainers.image.authors="WePublish Foundation"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV ADDRESS=0.0.0.0
ENV PORT=4000
### FRONT_ARG_REPLACER ###

WORKDIR /wepublish
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    chown -R wepublish:wepublish /wepublish && \
    echo "#!/bin/bash\n bash /wepublish/map-secrets.sh restore && node /wepublish/apps/${NEXT_PROJECT}/server.js" > /entrypoint.sh && \
    chown -R wepublish:wepublish /entrypoint.sh && \
    chmod +x /entrypoint.sh
COPY --chown=wepublish:wepublish --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/.next/standalone /wepublish
COPY --chown=wepublish:wepublish --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/public /wepublish/apps/${NEXT_PROJECT}/public
COPY --chown=wepublish:wepublish --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/.next/static /wepublish/apps/${NEXT_PROJECT}/public/_next/static
COPY --chown=wepublish:wepublish version /wepublish/apps/${NEXT_PROJECT}/public/deployed_version
COPY --chown=wepublish:wepublish --from=build-website /wepublish/secrets_name.list /wepublish/secrets_name.list
COPY --chown=wepublish:wepublish --from=build-website /wepublish/deployment/map-secrets.sh /wepublish/map-secrets.sh
RUN chmod -R g=u /wepublish
EXPOSE 4001
USER wepublish
ENTRYPOINT ["/entrypoint.sh"]

#######
## API
#######
FROM ${BUILD_IMAGE} AS build-api
COPY . .
RUN npm install -g @yao-pkg/pkg && \
    npx prisma generate && \
    npx nx build api-example && \
    cp docker/api_build_package.json package.json && \
    pkg package.json

FROM ${PLAIN_BUILD_IMAGE}  AS api
LABEL org.opencontainers.image.authors="WePublish Foundation"
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
COPY --chown=wepublish:wepublish libs/api/prisma/ca.crt /wepublish/ca.crt
COPY --chown=wepublish:wepublish .version /wepublish/.version
COPY --chown=wepublish:wepublish --from=build-api /wepublish/api /wepublish
COPY --chown=wepublish:wepublish --from=build-api /wepublish/node_modules/bcrypt node_modules/bcrypt
RUN chmod -R g=u /wepublish
EXPOSE 4000
USER wepublish
CMD /wepublish/api

#######
## Editor
#######

FROM ${BUILD_IMAGE} AS build-editor
COPY . .
RUN npm install -g @yao-pkg/pkg && \
    npx prisma generate && \
    npx nx build editor && \
    cp docker/editor_build_package.json package.json && \
    pkg package.json

FROM debian:bookworm-slim AS editor
LABEL org.opencontainers.image.authors="WePublish Foundation"
ENV NODE_ENV=production
ENV ADDRESS=0.0.0.0
ENV PORT=3000
WORKDIR /wepublish
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    chown -R wepublish:wepublish /wepublish
COPY --chown=wepublish:wepublish --from=build-editor /wepublish/editor /wepublish
COPY --chown=wepublish:wepublish --from=build-editor /wepublish/dist/apps/editor/browser dist/apps/editor/browser
RUN chmod -R g=u /wepublish
EXPOSE 3000
USER wepublish
CMD /wepublish/editor

#######
## Migrations
#######
FROM ${PLAIN_BUILD_IMAGE} AS build-migration
ENV NODE_ENV=production
WORKDIR /wepublish
COPY libs/settings/api/src/lib/setting.ts settings/api/src/lib/setting.ts
COPY libs/api/prisma/run-seed.ts api/prisma/run-seed.ts
COPY libs/api/prisma/seed.ts api/prisma/seed.ts
COPY libs/api/prisma/ca.crt /wepublish/ca.crt
COPY docker/tsconfig.yaml_seed tsconfig.yaml
RUN npm install prisma@5.0.0 @prisma/client@5.0.0 @types/node bcrypt typescript && \
    npx tsc -p tsconfig.yaml

FROM ${PLAIN_BUILD_IMAGE} AS migration
ENV NODE_ENV=production
LABEL org.opencontainers.image.authors="WePublish Foundation"
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
    npm install prisma@5.0.0 bcrypt && \
    npx prisma generate && \
    chmod -R g=u /wepublish
USER wepublish
CMD ["bash", "./start.sh"]


#######
## Media Server
#######

FROM ${PLAIN_BUILD_IMAGE} AS base-media
FROM base-media AS build-media
ENV LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libjemalloc.so"
WORKDIR /app
RUN apt-get update
RUN apt-get install -y libjemalloc-dev
COPY . .
COPY ./apps/media/package.json ./package.json
COPY ./apps/media/package-lock.json ./package-lock.json
RUN npm ci
RUN npx nx build media

FROM base-media AS media
ENV NODE_ENV=production
LABEL org.opencontainers.image.authors="WePublish Foundation"
WORKDIR /wepublish
ENV LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libjemalloc.so"
RUN groupadd -r wepublish && \
    useradd -r -g wepublish -d /wepublish wepublish && \
    apt-get update && \
    apt-get install -y libjemalloc-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
COPY --from=build-media /app/dist/apps/media/ .
COPY --from=build-media --chown=wepublish:wepublish /app/node_modules ./node_modules
RUN chmod -R g=u /wepublish
USER wepublish
EXPOSE 4100
CMD ["node", "main.js"]

######
## Storybook
######

FROM ${BUILD_IMAGE} AS storybook-builder
COPY . .
RUN npx nx run website:build-storybook


FROM nginx:alpine AS storybook
COPY --from=storybook-builder /wepublish/dist/storybook/website /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
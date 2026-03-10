ARG BUILD_IMAGE=dhi.io/node:22-debian13-dev
ARG PLAIN_BUILD_IMAGE=dhi.io/node:22-debian13-dev
ARG RUNTIME_IMAGE=dhi.io/node:22-debian13

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
COPY --chown=1001:0 --from=base-image-build /wepublish/node_modules/ node_modules/
RUN chmod -R g=u /wepublish

#######
## Website (needs bash at runtime for entrypoint)
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
RUN echo "#!/bin/bash\n bash /wepublish/map-secrets.sh restore && node /wepublish/apps/${NEXT_PROJECT}/server.js" > /entrypoint.sh && \
    chmod +x /entrypoint.sh
COPY --chown=1001:0 --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/.next/standalone /wepublish
COPY --chown=1001:0 --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/public /wepublish/apps/${NEXT_PROJECT}/public
COPY --chown=1001:0 --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/.next/static /wepublish/apps/${NEXT_PROJECT}/public/_next/static
COPY --chown=1001:0 version /wepublish/apps/${NEXT_PROJECT}/public/deployed_version
COPY --chown=1001:0 --from=build-website /wepublish/secrets_name.list /wepublish/secrets_name.list
COPY --chown=1001:0 --from=build-website /wepublish/deployment/map-secrets.sh /wepublish/map-secrets.sh
RUN chown 1001:0 /entrypoint.sh && chmod -R g=u /wepublish /entrypoint.sh
EXPOSE 4001
USER 1001
ENTRYPOINT ["/entrypoint.sh"]

#######
## API
#######
FROM ${BUILD_IMAGE} AS build-api
COPY . .
RUN npx prisma generate && \
    npx nx build api-example --ignore-nx-cache && \
    cp docker/api_build_package.json package.json && \
    npx @yao-pkg/pkg package.json

FROM ${PLAIN_BUILD_IMAGE} AS api-setup
WORKDIR /wepublish
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
COPY --chown=1001:0 apps/api-example/src/default.yaml /wepublish/config/default.yaml
COPY --chown=1001:0 libs/api/prisma/ca.crt /wepublish/ca.crt
COPY --chown=1001:0 .version /wepublish/.version
COPY --chown=1001:0 --from=build-api /wepublish/api /wepublish/
RUN chmod -R g=u /wepublish

FROM ${RUNTIME_IMAGE} AS api
LABEL org.opencontainers.image.authors="WePublish Foundation"
ENV NODE_ENV=production
ENV ADDRESS=0.0.0.0
ENV PORT=4000
ENV PKG_CACHE_PATH=/wepublish/.cache
WORKDIR /wepublish
COPY --from=api-setup /usr/lib/x86_64-linux-gnu/libssl.so* /usr/lib/x86_64-linux-gnu/
COPY --from=api-setup /usr/lib/x86_64-linux-gnu/libcrypto.so* /usr/lib/x86_64-linux-gnu/
COPY --from=api-setup /wepublish /wepublish
EXPOSE 4000
USER 1001
CMD ["/wepublish/api"]

#######
## Editor
#######

FROM ${BUILD_IMAGE} AS build-editor
COPY . .
RUN npx prisma generate && \
    npx nx build editor --ignore-nx-cache && \
    cp docker/editor_build_package.json package.json && \
    npx @yao-pkg/pkg package.json

FROM ${PLAIN_BUILD_IMAGE} AS editor-setup
WORKDIR /wepublish
COPY --chown=1001:0 --from=build-editor /wepublish/editor /wepublish/
COPY --chown=1001:0 --from=build-editor /wepublish/dist/apps/editor/browser dist/apps/editor/browser
RUN chmod -R g=u /wepublish

FROM ${RUNTIME_IMAGE} AS editor
LABEL org.opencontainers.image.authors="WePublish Foundation"
ENV NODE_ENV=production
ENV ADDRESS=0.0.0.0
ENV PORT=3000
WORKDIR /wepublish
COPY --from=editor-setup /wepublish /wepublish
EXPOSE 3000
USER 1001
CMD ["/wepublish/editor"]

#######
## Migrations (needs bash + npm at runtime)
#######
FROM ${PLAIN_BUILD_IMAGE} AS build-migration
ENV NODE_ENV=production
WORKDIR /wepublish
COPY libs/settings/api/src/lib/setting.ts settings/api/src/lib/setting.ts
COPY libs/api/prisma/run-seed.ts api/prisma/run-seed.ts
COPY libs/api/prisma/seed.ts api/prisma/seed.ts
COPY libs/api/prisma/ca.crt /wepublish/ca.crt
COPY docker/tsconfig.yaml_seed tsconfig.yaml
RUN npm install prisma@5.0.0 @prisma/client@5.0.0 @types/node @node-rs/argon2 typescript && \
    npx tsc -p tsconfig.yaml

FROM ${PLAIN_BUILD_IMAGE} AS migration
ENV NODE_ENV=production
LABEL org.opencontainers.image.authors="WePublish Foundation"
WORKDIR /wepublish
COPY --from=build-migration /wepublish/dist ./dist
COPY libs/api/prisma/migrations prisma/migrations
COPY libs/api/prisma/schema.prisma prisma/schema.prisma
COPY docker/migrate_start.sh start.sh
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm install prisma@5.0.0 @node-rs/argon2 && \
    npx prisma generate && \
    chmod -R g=u /wepublish
USER 1001
CMD ["bash", "./start.sh"]


#######
## Media Server
#######

FROM ${PLAIN_BUILD_IMAGE} AS build-media
ENV LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libjemalloc.so"
WORKDIR /app
RUN apt-get update && apt-get install -y libjemalloc-dev
COPY . .
COPY ./apps/media/package.json ./package.json
COPY ./apps/media/package-lock.json ./package-lock.json
RUN npm ci
RUN npx nx build media --ignore-nx-cache

FROM ${PLAIN_BUILD_IMAGE} AS media-setup
WORKDIR /wepublish
COPY --chown=1001:0 --from=build-media /app/dist/apps/media/ .
COPY --chown=1001:0 --from=build-media /app/node_modules ./node_modules
RUN chmod -R g=u /wepublish

FROM ${RUNTIME_IMAGE} AS media
ENV NODE_ENV=production
LABEL org.opencontainers.image.authors="WePublish Foundation"
WORKDIR /wepublish
ENV LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libjemalloc.so"
COPY --from=build-media /usr/lib/x86_64-linux-gnu/libjemalloc* /usr/lib/x86_64-linux-gnu/
COPY --from=media-setup /wepublish /wepublish
EXPOSE 4100
USER 1001
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

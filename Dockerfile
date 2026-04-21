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
COPY ./prisma.config.ts ./prisma.config.ts

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl python3 build-essential && \
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
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG APP_RELEASE_ID
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV APP_RELEASE_ID=${APP_RELEASE_ID}
### FRONT_ARG_REPLACER ###

COPY . .
RUN npx prisma generate && \
    npx nx build ${NEXT_PROJECT} ${NX_NEXT_PROJECT_BUILD_OPTIONS} && \
    npx @sentry/cli sourcemaps inject ./dist/apps/${NEXT_PROJECT}/.next && \
    npx @sentry/cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./dist/apps/${NEXT_PROJECT}/.next && \
    node /wepublish/deployment/map-secrets.js clean

FROM ${PLAIN_BUILD_IMAGE} AS website-setup
LABEL org.opencontainers.image.authors="WePublish Foundation"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV ADDRESS=0.0.0.0
ENV PORT=4000
ARG APP_RELEASE_ID
ENV APP_RELEASE_ID=${APP_RELEASE_ID}
### FRONT_ARG_REPLACER ###

WORKDIR /wepublish
COPY --chown=1001:0 --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/.next/standalone /wepublish
COPY --chown=1001:0 --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/public /wepublish/apps/${NEXT_PROJECT}/public
COPY --chown=1001:0 --from=build-website /wepublish/dist/apps/${NEXT_PROJECT}/.next/static /wepublish/apps/${NEXT_PROJECT}/public/_next/static
COPY --chown=1001:0 version /wepublish/apps/${NEXT_PROJECT}/public/deployed_version
COPY --chown=1001:0 --from=build-website /wepublish/secrets_name.list /wepublish/secrets_name.list
COPY --chown=1001:0 --from=build-website /wepublish/deployment/map-secrets.js /wepublish/map-secrets.js
RUN printf '{"serverPath":"/wepublish/apps/%s/server.js"}' "${NEXT_PROJECT}" > /wepublish/startup-config.json && \
    chmod -R g=u /wepublish

FROM ${RUNTIME_IMAGE} AS website
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV ADDRESS=0.0.0.0
ENV PORT=4000
WORKDIR /wepublish
COPY --from=website-setup /wepublish /wepublish
EXPOSE 4001
USER 1001
CMD ["node", "/wepublish/map-secrets.js", "restore", "--start"]

#######
## API
#######
FROM ${BUILD_IMAGE} AS build-api
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG APP_RELEASE_ID
COPY . .
RUN npx prisma generate && \
    grep -q "require('#main-entry-point')" node_modules/.prisma/client/default.js || \
    (echo "ERROR: Prisma client no longer uses #main-entry-point — update the pkg workaround" && exit 1) && \
    sed -i "s|require('#main-entry-point')|require('./index.js')|" node_modules/.prisma/client/default.js && \
    npx nx build api-example --ignore-nx-cache && \
    npx @sentry/cli sourcemaps inject ./dist/apps/api-example && \
    npx @sentry/cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./dist/apps/api-example && \
    cp docker/api_build_package.json package.json && \
    npx @yao-pkg/pkg package.json

# Collect only Prisma + pg runtime deps for the API binary
FROM ${PLAIN_BUILD_IMAGE} AS api-prisma-deps
WORKDIR /deps
RUN --mount=from=build-api,source=/wepublish/node_modules,target=/src \
    mkdir -p node_modules && \
    cp -a /src/.prisma /src/@prisma node_modules/ && \
    cd /src && cp -a \
    pg pg-pool pg-protocol pg-types pg-connection-string \
    pgpass pg-int8 postgres-array postgres-bytea postgres-date \
    postgres-interval split2 \
    /deps/node_modules/

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
COPY --chown=1001:0 --from=api-prisma-deps /deps/node_modules ./node_modules
RUN mkdir -p /wepublish/.cache/pkg && \
    chmod -R g=u /wepublish

FROM ${RUNTIME_IMAGE} AS api
LABEL org.opencontainers.image.authors="WePublish Foundation"
ARG APP_RELEASE_ID
ENV APP_RELEASE_ID=${APP_RELEASE_ID}
ENV NODE_ENV=production
ENV ADDRESS=0.0.0.0
ENV PORT=4000
ENV HOME=/wepublish
ENV NODE_OPTIONS="--max-old-space-size=1024"
WORKDIR /wepublish
COPY --from=api-setup /usr/lib/x86_64-linux-gnu/libssl.so* /usr/lib/x86_64-linux-gnu/
COPY --from=api-setup /usr/lib/x86_64-linux-gnu/libcrypto.so* /usr/lib/x86_64-linux-gnu/
COPY --from=api-setup /usr/lib/x86_64-linux-gnu/libz.so* /usr/lib/x86_64-linux-gnu/
COPY --from=api-setup /usr/lib/x86_64-linux-gnu/libzstd.so* /usr/lib/x86_64-linux-gnu/
COPY --from=api-setup /wepublish /wepublish
EXPOSE 4000
USER 1001
CMD ["/wepublish/api"]

#######
## Editor
#######

FROM ${BUILD_IMAGE} AS build-editor
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG APP_RELEASE_ID
COPY . .
RUN npx prisma generate && \
    npx nx build editor --ignore-nx-cache && \
    npx @sentry/cli sourcemaps inject ./dist/apps/editor && \
    npx @sentry/cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./dist/apps/editor && \
    cp docker/editor_build_package.json package.json && \
    npx @yao-pkg/pkg package.json

FROM ${PLAIN_BUILD_IMAGE} AS editor-setup
WORKDIR /wepublish
COPY --chown=1001:0 --from=build-editor /wepublish/editor /wepublish/
COPY --chown=1001:0 --from=build-editor /wepublish/dist/apps/editor/browser dist/apps/editor/browser
RUN chmod -R g=u /wepublish

FROM ${RUNTIME_IMAGE} AS editor
LABEL org.opencontainers.image.authors="WePublish Foundation"
ARG APP_RELEASE_ID
ENV APP_RELEASE_ID=${APP_RELEASE_ID}
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
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG APP_RELEASE_ID
ENV NODE_ENV=production
WORKDIR /wepublish
COPY libs/settings/api/src/lib/setting.ts settings/api/src/lib/setting.ts
COPY libs/api/prisma/run-seed.ts api/prisma/run-seed.ts
COPY libs/api/prisma/seed.ts api/prisma/seed.ts
COPY libs/api/prisma/schema.prisma prisma/schema.prisma
COPY prisma.config.ts prisma.config.ts
COPY libs/api/prisma/ca.crt /wepublish/ca.crt
COPY docker/tsconfig.yaml_seed tsconfig.yaml
RUN npm install prisma@7.5.0 @prisma/client@7.5.0 @prisma/adapter-pg pg @types/node @node-rs/argon2 typescript@~5.7.3 && \
    npx prisma generate && \
    npx tsc -p tsconfig.yaml && \
    npx @sentry/cli sourcemaps inject ./dist && \
    npx @sentry/cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./dist

FROM ${PLAIN_BUILD_IMAGE} AS migration-setup
ARG APP_RELEASE_ID
ENV APP_RELEASE_ID=${APP_RELEASE_ID}
ENV NODE_ENV=production
WORKDIR /wepublish
COPY --from=build-migration /wepublish/dist ./dist
COPY libs/api/prisma/migrations prisma/migrations
COPY libs/api/prisma/schema.prisma prisma/schema.prisma
COPY libs/api/prisma/ca.crt /wepublish/ca.crt
COPY prisma.config.ts prisma.config.ts
COPY docker/migrate_start.js start.js
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm install prisma@7.5.0 @prisma/client@7.5.0 @prisma/adapter-pg pg @node-rs/argon2 && \
    npx prisma generate && \
    chmod -R g=u /wepublish

FROM ${RUNTIME_IMAGE} AS migration
ENV NODE_ENV=production
LABEL org.opencontainers.image.authors="WePublish Foundation"
WORKDIR /wepublish
COPY --from=migration-setup /usr/lib/x86_64-linux-gnu/libssl.so* /usr/lib/x86_64-linux-gnu/
COPY --from=migration-setup /usr/lib/x86_64-linux-gnu/libcrypto.so* /usr/lib/x86_64-linux-gnu/
COPY --from=migration-setup /usr/lib/x86_64-linux-gnu/libz.so* /usr/lib/x86_64-linux-gnu/
COPY --from=migration-setup /usr/lib/x86_64-linux-gnu/libzstd.so* /usr/lib/x86_64-linux-gnu/
COPY --from=migration-setup /wepublish /wepublish
USER 1001
CMD ["node", "start.js"]


#######
## Media Server
#######

FROM ${PLAIN_BUILD_IMAGE} AS build-media
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG APP_RELEASE_ID
ENV LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libjemalloc.so"
WORKDIR /app
RUN apt-get update && apt-get install -y libjemalloc-dev poppler-utils fonts-liberation
COPY . .
COPY ./apps/media/package.json ./package.json
COPY ./apps/media/package-lock.json ./package-lock.json
RUN npm ci
RUN npx nx build media --ignore-nx-cache && \
    npx @sentry/cli sourcemaps inject ./dist/apps/media && \
    npx @sentry/cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./dist/apps/media && \
    mkdir -p /poppler-dist/bin /poppler-dist/lib && \
    cp /usr/bin/pdftoppm /poppler-dist/bin/ && \
    ldd /usr/bin/pdftoppm | awk '/=>/ {print $3}' | xargs -I{} cp -L {} /poppler-dist/lib/ 2>/dev/null || true

FROM ${PLAIN_BUILD_IMAGE} AS media-setup
WORKDIR /wepublish
COPY --chown=1001:0 --from=build-media /app/dist/apps/media/ .
COPY --chown=1001:0 --from=build-media /app/node_modules ./node_modules
RUN chmod -R g=u /wepublish

FROM ${RUNTIME_IMAGE} AS media
ARG MEDIA_FALLBACK_URL
ARG APP_RELEASE_ID
ENV APP_RELEASE_ID=${APP_RELEASE_ID}
ENV NODE_ENV=production
ENV MEDIA_FALLBACK_URL=${MEDIA_FALLBACK_URL}
LABEL org.opencontainers.image.authors="WePublish Foundation"
WORKDIR /wepublish
ENV LD_PRELOAD="/usr/lib/x86_64-linux-gnu/libjemalloc.so"
ENV NODE_OPTIONS="--max-old-space-size=512"
COPY --from=build-media /usr/lib/x86_64-linux-gnu/libjemalloc* /usr/lib/x86_64-linux-gnu/
COPY --from=build-media /poppler-dist/bin/pdftoppm /usr/bin/pdftoppm
COPY --from=build-media /usr/share/fonts/ /usr/share/fonts/
COPY --from=build-media /etc/fonts/ /etc/fonts/
COPY --from=build-media /poppler-dist/lib/ /usr/lib/x86_64-linux-gnu/
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

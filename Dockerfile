ARG BUILD_IMAGE=dhi.io/node:22-debian13-dev
ARG PLAIN_BUILD_IMAGE=dhi.io/node:22-debian13-dev
ARG RUNTIME_IMAGE=dhi.io/node:22-debian13
ARG PNPM_VERSION=12.9.1

#######
## Base Image
#######
FROM ${PLAIN_BUILD_IMAGE} AS base-image-build
ARG PNPM_VERSION
WORKDIR /wepublish
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./
COPY ./apps/api-example/package.json ./apps/api-example/package.json
COPY ./apps/editor/package.json ./apps/editor/package.json
COPY ./apps/media/package.json ./apps/media/package.json
COPY ./docker/migration/package.json ./docker/migration/package.json
COPY ./libs/api/prisma/schema.prisma ./libs/api/prisma/schema.prisma
COPY ./prisma.config.ts ./prisma.config.ts

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl python3 build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    npm install -g --no-audit --no-fund pnpm@${PNPM_VERSION} && \
    pnpm install --frozen-lockfile

FROM ${PLAIN_BUILD_IMAGE} AS base-image
ARG PNPM_VERSION
LABEL org.opencontainers.image.authors="WePublish Foundation"
ENV NODE_ENV=production
WORKDIR /wepublish
RUN npm install -g --no-audit --no-fund pnpm@${PNPM_VERSION}
COPY --chown=1001:0 --from=base-image-build /wepublish/node_modules/ node_modules/
RUN chmod -R g=u /wepublish

# The api, editor and media stages ship `pnpm deploy --prod` output: exactly the
# runtime dependencies listed in apps/<app>/package.json. pnpm 12.9 also leaves
# an unreferenced copy of every package under `.pnpm/@` and `.pnpm/@<scope>`
# (real scoped packages live in `.pnpm/@scope+name@…`), so those are deleted.

#######
## Website (needs bash at runtime for entrypoint)
#######

FROM ${BUILD_IMAGE} AS  build-website
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG SENTRY_DSN
ARG APP_RELEASE_ID
ARG SSR_FETCH_TIMEOUT_MS
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV SENTRY_ORG=${SENTRY_ORG}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ENV SENTRY_RELEASE=${SENTRY_RELEASE}
ENV SENTRY_DSN=${SENTRY_DSN}
ENV APP_RELEASE_ID=${APP_RELEASE_ID}
ENV SSR_FETCH_TIMEOUT_MS=${SSR_FETCH_TIMEOUT_MS}
### FRONT_ARG_REPLACER ###

COPY . .
# Sourcemaps are injected and uploaded by withSentryConfig during `nx build`
# (it picks up SENTRY_AUTH_TOKEN/ORG/PROJECT/RELEASE from the env set above).
# Do not add a manual `sentry-cli sourcemaps upload` here: the client maps are
# already deleted by then, and it would walk .next/standalone/node_modules.
RUN pnpm exec prisma generate && \
    pnpm exec nx build ${NEXT_PROJECT} ${NX_NEXT_PROJECT_BUILD_OPTIONS} && \
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
COPY --chown=1001:0 libs/api/prisma/ca.crt /wepublish/ca.crt
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
RUN pnpm exec prisma generate && \
    pnpm exec nx build api-example --skip-nx-cache && \
    node docker/check-runtime-deps.js dist/apps/api-example apps/api-example/package.json && \
    pnpm exec sentry-cli sourcemaps inject ./dist/apps/api-example && \
    { pnpm exec sentry-cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./dist/apps/api-example || echo "sentry sourcemaps upload failed, continuing build"; } && \
    pnpm --filter @wepublish/api-example deploy --prod /deploy && \
    find /deploy/node_modules/.pnpm -maxdepth 1 -name '@*' ! -name '*+*' -exec rm -rf {} + && \
    mkdir -p /deploy/prisma && \
    cp libs/api/prisma/schema.prisma /deploy/prisma/schema.prisma && \
    cd /deploy && /wepublish/node_modules/.bin/prisma generate --schema prisma/schema.prisma

FROM ${PLAIN_BUILD_IMAGE} AS api-setup
WORKDIR /wepublish
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
COPY --chown=1001:0 apps/api-example/src/default.yaml /wepublish/config/default.yaml
COPY --chown=1001:0 libs/api/prisma/ca.crt /wepublish/ca.crt
COPY --chown=1001:0 .version /wepublish/.version
COPY --chown=1001:0 --from=build-api /wepublish/dist/apps/api-example/ /wepublish/
COPY --chown=1001:0 --from=build-api /deploy/node_modules ./node_modules
RUN chmod -R g=u /wepublish

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
CMD ["node", "main.js"]

#######
## Editor
#######

FROM ${BUILD_IMAGE} AS build-editor
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG APP_RELEASE_ID
ENV NODE_OPTIONS="--max-old-space-size=6144"
COPY . .
RUN pnpm exec prisma generate && \
    pnpm exec nx build editor --skip-nx-cache && \
    node docker/check-runtime-deps.js dist/apps/editor apps/editor/package.json && \
    pnpm exec sentry-cli sourcemaps inject ./dist/apps/editor && \
    { pnpm exec sentry-cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./dist/apps/editor || echo "sentry sourcemaps upload failed, continuing build"; } && \
    pnpm --filter @wepublish/editor deploy --prod /deploy && \
    find /deploy/node_modules/.pnpm -maxdepth 1 -name '@*' ! -name '*+*' -exec rm -rf {} +

FROM ${PLAIN_BUILD_IMAGE} AS editor-setup
WORKDIR /wepublish
COPY --chown=1001:0 --from=build-editor /wepublish/dist/apps/editor/main.js /wepublish/main.js
COPY --chown=1001:0 --from=build-editor /wepublish/dist/apps/editor/browser dist/apps/editor/browser
COPY --chown=1001:0 --from=build-editor /deploy/node_modules ./node_modules
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
CMD ["node", "main.js"]

#######
## Migrations
#######
FROM ${BUILD_IMAGE} AS build-migration
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG APP_RELEASE_ID
COPY . .
RUN pnpm exec prisma generate && \
    mkdir -p migration-build/api/prisma migration-build/settings/api/src/lib migration-build/changelog && \
    cp libs/api/prisma/run-seed.ts libs/api/prisma/seed.ts migration-build/api/prisma/ && \
    cp libs/settings/api/src/lib/setting.ts migration-build/settings/api/src/lib/ && \
    cp libs/changelog/api/src/lib/sync/run-sync-changelogs.ts libs/changelog/api/src/lib/sync/sync-changelogs.ts libs/changelog/api/src/lib/sync/parse-changelog-markdown.ts migration-build/changelog/ && \
    cp docker/tsconfig.yaml_seed migration-build/tsconfig.json && \
    pnpm exec tsc -p migration-build/tsconfig.json && \
    pnpm exec sentry-cli sourcemaps inject ./migration-build/dist && \
    { pnpm exec sentry-cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./migration-build/dist || echo "sentry sourcemaps upload failed, continuing build"; } && \
    pnpm --filter @wepublish/migration deploy --prod /deploy && \
    find /deploy/node_modules/.pnpm -maxdepth 1 -name '@*' ! -name '*+*' -exec rm -rf {} + && \
    mkdir -p /deploy/prisma && \
    cp libs/api/prisma/schema.prisma /deploy/prisma/schema.prisma && \
    cd /deploy && /wepublish/node_modules/.bin/prisma generate --schema prisma/schema.prisma

FROM ${PLAIN_BUILD_IMAGE} AS migration-setup
ARG APP_RELEASE_ID
ENV APP_RELEASE_ID=${APP_RELEASE_ID}
ENV NODE_ENV=production
WORKDIR /wepublish
COPY --from=build-migration /wepublish/migration-build/dist ./dist
COPY --from=build-migration /deploy/node_modules ./node_modules
COPY libs/api/prisma/migrations prisma/migrations
COPY libs/api/changelogs changelogs
COPY libs/api/prisma/schema.prisma prisma/schema.prisma
COPY libs/api/prisma/ca.crt /wepublish/ca.crt
COPY prisma.config.ts prisma.config.ts
COPY docker/migrate_start.js start.js
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
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

FROM ${BUILD_IMAGE} AS build-media
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG SENTRY_RELEASE
ARG APP_RELEASE_ID
RUN apt-get update && apt-get install -y libjemalloc-dev poppler-utils fonts-liberation
COPY . .
RUN pnpm exec nx build media --skip-nx-cache && \
    node docker/check-runtime-deps.js dist/apps/media apps/media/package.json && \
    pnpm exec sentry-cli sourcemaps inject ./dist/apps/media && \
    { pnpm exec sentry-cli sourcemaps upload --auth-token=${SENTRY_AUTH_TOKEN} --org=${SENTRY_ORG} --project=${SENTRY_PROJECT} --release=${SENTRY_RELEASE} ./dist/apps/media || echo "sentry sourcemaps upload failed, continuing build"; } && \
    pnpm --filter @wepublish/media deploy --prod /deploy && \
    find /deploy/node_modules/.pnpm -maxdepth 1 -name '@*' ! -name '*+*' -exec rm -rf {} + && \
    mkdir -p /poppler-dist/bin /poppler-dist/lib && \
    cp /usr/bin/pdftoppm /poppler-dist/bin/ && \
    { ldd /usr/bin/pdftoppm | awk '/=>/ {print $3}' | xargs -I{} cp -L {} /poppler-dist/lib/ 2>/dev/null || true; }

FROM ${PLAIN_BUILD_IMAGE} AS media-setup
WORKDIR /wepublish
COPY --chown=1001:0 --from=build-media /wepublish/dist/apps/media/ .
COPY --chown=1001:0 --from=build-media /deploy/node_modules ./node_modules
COPY --chown=1001:0 libs/api/prisma/ca.crt /wepublish/ca.crt
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
ENV UV_THREADPOOL_SIZE=16
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
RUN pnpm exec nx run website:build-storybook


FROM nginx:alpine AS storybook
COPY --from=storybook-builder /wepublish/dist/storybook/website /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

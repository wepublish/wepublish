FROM ghcr.io/wepublish/node:16.1 as production

RUN apk update

USER node
RUN mkdir -p /home/node/wepublish
WORKDIR /home/node/wepublish

COPY --chown=node:node ./package.json ./package.json
COPY --chown=node:node ./nx.json ./nx.json
COPY --chown=node:node ./yarn.lock ./yarn.lock
COPY --chown=node:node ./tsconfig.base.json ./tsconfig.base.json
COPY --chown=node:node ./babel.config.json ./babel.config.json
COPY --chown=node:node ./LICENSE ./LICENSE

COPY --chown=node:node ./libs/ ./libs/
COPY --chown=node:node ./apps/ ./apps/

RUN yarn install
RUN yarn build

ENV ADDRESS=0.0.0.0
ENV PORT=8000
EXPOSE 8000


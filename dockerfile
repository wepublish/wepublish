FROM ghcr.io/wepublish/node:latest as app

RUN apk update

USER node
RUN mkdir -p /home/node/wepublish
WORKDIR /home/node/wepublish

COPY --chown=node:node ./package.json ./package.json
COPY --chown=node:node ./yarn.lock ./yarn.lock
COPY --chown=node:node ./tsconfig.base.json ./tsconfig.base.json
COPY --chown=node:node ./LICENSE ./LICENSE

COPY --chown=node:node ./examples/ ./examples/
COPY --chown=node:node ./packages/ ./packages/

RUN yarn install

ENV ADDRESS=0.0.0.0
ENV PORT=8000
EXPOSE 8000

RUN yarn build:production

FROM app as demo
RUN yarn build:demo


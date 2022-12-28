FROM ghcr.io/wepublish/node:16.1 as production

RUN apk update

USER node
RUN mkdir -p /home/node/wepublish
WORKDIR /home/node/wepublish

COPY --chown=node:node . .

RUN npm ci
RUN npx nx build editor

ENV ADDRESS=0.0.0.0
ENV PORT=8000
EXPOSE 8000


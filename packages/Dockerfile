FROM node:10.16-alpine as builder

WORKDIR /home/node/

# Install build tools
RUN apk add python gcc g++ make --update-cache

COPY packages/ packages/

COPY LICENSE .
COPY tsconfig.base.json .
COPY package.json .
COPY yarn.lock .
COPY scripts/ scripts/

RUN yarn install --pure-lockfile --non-interactive
RUN yarn build:core && yarn build:webpack && yarn build:react

CMD yarn watch:core & yarn watch:webpack & yarn watch:react

FROM node:10.16-alpine as builder

WORKDIR /home/node/

# Install build tools
RUN apk add python gcc g++ make --update-cache

COPY packages/core/ packages/core/
COPY packages/webpack/ packages/webpack/
COPY packages/react/ packages/react/
COPY services/example/ services/example/

COPY LICENSE .
COPY tsconfig.base.json .
COPY package.json .
COPY yarn.lock .
COPY scripts/ scripts/

RUN yarn install --pure-lockfile --non-interactive
RUN yarn build:webpack

CMD yarn watch:example

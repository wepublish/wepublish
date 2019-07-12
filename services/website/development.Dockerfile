FROM node:10.16-alpine as builder

WORKDIR /home/node/

# Install build tools
RUN apk add python gcc g++ make --update-cache

COPY packages/core/ packages/core/
COPY packages/webpack/ packages/webpack/
COPY packages/website/ packages/website/
COPY services/website/ services/website/

COPY LICENSE .
COPY tsconfig.base.json .
COPY package.json .
COPY yarn.lock .
COPY .yarnclean .
COPY scripts/ scripts/

RUN yarn install --pure-lockfile --non-interactive
RUN yarn build:webpack

CMD yarn watch:website-service

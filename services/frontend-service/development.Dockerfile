FROM node:10.16-alpine as builder

WORKDIR /home/node/

# Install build tools
RUN apk add python gcc g++ make --update-cache

COPY packages/webpack/ packages/webpack/
COPY packages/frontend/ packages/frontend/
COPY services/frontend-service/ services/frontend-service/

COPY LICENSE .
COPY tsconfig.base.json .
COPY package.json .
COPY yarn.lock .
COPY .yarnclean .
COPY scripts/ scripts/

RUN yarn install --pure-lockfile --non-interactive
RUN yarn build:webpack

CMD yarn install --pure-lockfile --non-interactive && yarn watch:frontend & yarn watch:frontend-service

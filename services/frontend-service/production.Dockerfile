FROM node:10.16-alpine as builder

WORKDIR /home/node/

COPY packages/frontend/ packages/frontend/
COPY services/frontend-service/ services/frontend-service/

COPY LICENSE .
COPY tsconfig.base.json .
COPY package.json .
COPY yarn.lock .
COPY .yarnclean .
COPY scripts/ scripts/

RUN yarn install --pure-lockfile --non-interactive
RUN yarn build:frontend
RUN yarn build:frontend-service

# Copy to final image
FROM node:10.16-alpine

ARG HOME_DIR=/home/node/
WORKDIR $HOME_DIR

COPY --from=builder $HOME_DIR .

# Install build tools
RUN apk add python gcc g++ make --update-cache
RUN yarn install --production --pure-lockfile --non-interactive --cache-folder ./yarn-cache; rm -rf ./yarn-cache

RUN chown -R node:node $HOME_DIR
USER node

CMD yarn workspace @wepublish/frontend-service start
EXPOSE 3000

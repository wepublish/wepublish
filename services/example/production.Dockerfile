FROM node:10.16-alpine as builder

WORKDIR /home/node/

COPY packages/website/ packages/website/
COPY services/website/ services/website/

COPY LICENSE .
COPY tsconfig.base.json .
COPY package.json .
COPY yarn.lock .
COPY .yarnclean .
COPY scripts/ scripts/

RUN yarn install --pure-lockfile --non-interactive
RUN yarn build:react
RUN yarn build:website

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

CMD yarn workspace @wepublish/website start
EXPOSE 3000

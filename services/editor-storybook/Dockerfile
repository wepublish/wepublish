FROM node:10.16-alpine as builder

WORKDIR /home/node/

# Install build tools
RUN apk add python gcc g++ make --update-cache

COPY packages/core/ packages/core/
COPY packages/react/ packages/react/
COPY services/editor-storybook/ services/editor-storybook/

COPY LICENSE .
COPY tsconfig.base.json .
COPY package.json .
COPY yarn.lock .
COPY scripts/ scripts/

RUN yarn install --pure-lockfile --non-interactive
CMD yarn start:editor-storybook

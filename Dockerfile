FROM node:16-alpine3.17 as builder

WORKDIR /build

RUN apk upgrade --update-cache --available && \
    apk add python3 gcc g++ make openssl && \
    rm -rf /var/cache/apk/*

COPY libs/api/prisma/schema.prisma ./libs/api/prisma/schema.prisma
COPY .npmrc package.json package-lock.json ./
RUN npm ci

COPY . .
RUN rm -rf .env*
RUN npm run build --prod


FROM node:16-alpine3.17 as runtime
WORKDIR /app
COPY --chown=node:node --from=builder /build/dist ./dist
COPY --chown=node:node --from=builder /build/node_modules/.prisma/client ./dist/apps

USER node
ENV ADDRESS=0.0.0.0
ENV PORT=8000
EXPOSE 8000

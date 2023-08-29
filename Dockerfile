FROM node:16-alpine3.17 as dependencies

WORKDIR /dependencies

RUN apk update
RUN apk add python3 gcc g++ make --update-cache

WORKDIR /dependencies
COPY libs/api/prisma/schema.prisma ./libs/api/prisma/schema.prisma
COPY .npmrc package.json package-lock.json ./
RUN npm ci


FROM node:16-alpine3.17 as builder
WORKDIR /build
COPY . .
RUN rm -rf .env*
COPY --from=dependencies /dependencies .
RUN npm run build --prod


FROM node:16-alpine3.17
WORKDIR /app
COPY --chown=node:node --from=builder /build/node_modules ./node_modules
COPY --chown=node:node --from=builder /build/dist ./dist
USER node
ENV ADDRESS=0.0.0.0
ENV PORT=8000
EXPOSE 8000

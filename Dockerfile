FROM ghcr.io/wepublish/node:16.1 as dependencies
RUN apk update
USER node
RUN mkdir -p /home/node/wepublish
WORKDIR /home/node/wepublish
COPY --chown=node:node . .
RUN rm -rf .env
RUN npm ci

FROM dependencies as storybook-builder
RUN npx nx run website:build-storybook


FROM nginx:alpine as storybook
COPY --from=storybook-builder /home/node/wepublish/dist/storybook/website /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


FROM dependencies as production
RUN npm run build
ENV ADDRESS=0.0.0.0
ENV PORT=8000
EXPOSE 8000

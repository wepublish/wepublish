FROM node:24-bookworm

WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY onlinereports-scripts/package.json onlinereports-scripts/package-lock.json* /app/
RUN npm install

RUN npx playwright@1.60.0 install --with-deps

COPY onlinereports-scripts/ /app/onlinereports-scripts
COPY shared-scripts/ /app/shared-scripts

CMD ["node", "onlinereports-scripts/onlinereports-screenshots.js"]

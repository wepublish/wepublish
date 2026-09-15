FROM node:24-bookworm

WORKDIR /app

# The browsers are installed explicitly below, so skip the playwright package's
# own postinstall download to avoid downloading them twice.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# we copy package.json and package-lock.json* twice (see copy ..) below
# allows us to cache package installation
COPY hauptstadt-scripts/package.json hauptstadt-scripts/package-lock.json* /app/
RUN npm install

RUN npx playwright@1.60.0 install --with-deps

COPY hauptstadt-scripts/ /app/hauptstadt-scripts
COPY shared-scripts/ /app/shared-scripts

CMD ["node", "hauptstadt-scripts/hauptstadt-screenshots.js"]

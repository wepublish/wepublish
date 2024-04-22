FROM  node:16.15.0-bullseye-slim
MAINTAINER Seccom Ltd
ENV HOST 0.0.0.0
ENV NUXT_TELEMETRY_DISABLED 1
RUN mkdir -p /webiste
WORKDIR /webiste
COPY . .
RUN apt-get update && \
    apt-get -y install libjemalloc-dev  && \
    echo "/usr/lib/x86_64-linux-gnu/libjemalloc.so" >> /etc/ld.so.preload && \
    apt-get clean && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir /.npm && \
    chmod -R 777 /.npm && \
    npm install && \
    npm run build
EXPOSE 3000
CMD ["npm", "start"]

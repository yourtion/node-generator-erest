FROM node:10-alpine
ENV NODE_ENV=production

RUN apk --no-cache add tzdata  && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

EXPOSE 8080
WORKDIR /app
CMD npm dist/index.js
ADD .npmrc /app/

ADD package.json /app/
RUN npm run tnpm -- --production && rm -rf ~/.npm
ADD config/ /app/config/
RUN mkdir /app/logs && touch /app/config/production.yaml
ADD dist/ /app/dist/

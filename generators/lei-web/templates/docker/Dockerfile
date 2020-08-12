FROM node:12-alpine
ENV NODE_ENV=production

RUN apk --no-cache add tzdata  && \
  ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
  echo "Asia/Shanghai" > /etc/timezone

EXPOSE 8080
WORKDIR /app
CMD node dist/index.js

ADD .npmrc /app/
ADD package.json /app/
ADD config/ /app/config/
RUN mkdir /app/logs && touch /app/config/production.yaml
ADD dist/ /app/dist/
ADD node_modules/ /app/node_modules/
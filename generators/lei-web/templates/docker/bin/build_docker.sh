#!/bin/sh

label=$1

if [ -z $label ]; then
  label=latest
fi

image=$(node -p "require('./package.json').name")

function run_on_container {
  echo "run_on_container: $*"
  docker run -u 1000 -it --rm -v $(pwd):/app -v $HOME/.npmrc:/home/node/.npmrc -w /app node:12-alpine $*
}

rm -rf dist && \
run_on_container env && \
run_on_container npm run orz && \
run_on_container npx tsc && \
run_on_container rm -rf /app/node_modules && \
run_on_container npm run orz --production && \
docker build -t $image:$label .

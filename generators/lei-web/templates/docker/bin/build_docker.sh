#!/bin/sh

label=$1

if [ -z $label ]; then
  label=latest
fi

image=$(node -p "require('./package.json').name")

rm -rf dist && docker run -u 1000 -it --rm -v $(pwd):/app -w /app node:10-alpine npm run tnpm && npx tsc && docker build -t $image:$label .

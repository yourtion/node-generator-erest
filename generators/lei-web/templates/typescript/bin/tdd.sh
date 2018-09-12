#!/bin/sh

cd $(pwd)

export NODE_ENV=test
export LOG=true
./node_modules/.bin/mocha -b -r ts-node/register --watch-extensions ts --watch test/api/test-$1.ts

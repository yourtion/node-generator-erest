#!/bin/sh

cd $(pwd)

export NODE_ENV=test
export LOG=true
./node_modules/.bin/mocha --watch-extensions ts --watch test/api/test-$1.ts

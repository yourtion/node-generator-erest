#!/bin/sh

cd $(pwd)

export NODE_ENV=test
export LOG=true
export DEBUG=erest:test*
./node_modules/.bin/mocha --watch-extensions ts --watch test/api/test-$1.ts

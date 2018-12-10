#!/bin/sh

set -e

cd $(pwd) && cd ../scripts

npx ts-node docs.ts -P .

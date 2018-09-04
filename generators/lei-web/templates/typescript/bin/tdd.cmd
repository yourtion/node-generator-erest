cd $(pwd)

set NODE_ENV=test
set DEBUG=erest:test*
set LOG=true
mocha  -r ts-node/register --watch-extensions ts --watch test/api/test-$1.ts

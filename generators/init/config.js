const dependencies = [
  'bluebird',
  'connect-redis',
  'erest',
  'express',
  'express-coroutine',
  'express-session',
  'ioredis',
  'js-yaml',
  'lodash',
  'mysql',
  'pino',
  'squel',
];

const dependenciesTypes = [
  '@types/bluebird',
  '@types/connect-redis',
  '@types/express',
  '@types/express-session',
  '@types/ioredis',
  '@types/js-yaml',
  '@types/lodash',
  '@types/mysql',
  '@types/node',
  '@types/pino',
];

const devDependencies = ['chai', 'debug', 'mocha', 'prettier', 'supertest', 'ts-node', 'tslint', 'typescript'];

const devDependenciesTypes = ['@types/chai', '@types/debug', '@types/mocha', '@types/prettier', '@types/supertest'];

exports.getTSDeps = () => {
  return [].concat(dependencies, dependenciesTypes);
};

exports.getTSDevDeps = () => {
  return [].concat(devDependencies, devDependenciesTypes);
};

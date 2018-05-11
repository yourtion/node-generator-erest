const dependencies = [
  'bluebird',
  'connect-redis',
  'erest',
  'express',
  'express-coroutine',
  'express-session',
  'ioredis',
  'lodash',
  'mysql',
  'pino',
  'squel',
];

const dependenciesTS = [
  'js-yaml',
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

const devDependenciesTS = ['@types/chai', '@types/debug', '@types/mocha', '@types/prettier', '@types/supertest'];

exports.getTSDeps = () => {
  return [].concat(dependencies, dependenciesTS);
};

exports.getTSDevDeps = () => {
  return [].concat(devDependencies, devDependenciesTS);
};

exports.getJSDeps = () => {
  return dependencies;
};

exports.getJSDevDeps = () => {
  return devDependencies;
};

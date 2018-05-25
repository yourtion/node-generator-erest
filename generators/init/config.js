const dependencies = [
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
  'uuid',
];

const dependenciesTS = [
  'js-yaml',
  '@types/connect-redis',
  '@types/express',
  '@types/express-session',
  '@types/ioredis',
  '@types/js-yaml',
  '@types/lodash',
  '@types/mysql',
  '@types/node',
  '@types/pino',
  '@types/uuid',
  '@types/debug',
  '@types/supertest',
];

const devDependencies = ['chai', 'debug', 'mocha', 'prettier', 'supertest', 'ts-node', 'tslint', 'typescript'];

const devDependenciesTS = ['@types/chai', '@types/mocha', '@types/prettier'];

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

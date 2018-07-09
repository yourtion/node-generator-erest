const dependencies = [
  'erest',
  'express',
  'express-coroutine',
  'ioredis',
  'lodash',
  'mysql',
  'pino',
  'squel',
  'uuid',
  'js-yaml',
];

const dependenciesTS = [
  '@types/express',
  '@types/ioredis',
  '@types/js-yaml',
  '@types/lodash',
  '@types/mysql',
  '@types/node',
  '@types/pino',
  '@types/uuid',
  '@types/debug',
];

const devDependencies = ['chai', 'debug', 'mocha', 'prettier', 'supertest', 'ts-node', 'typescript'];

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

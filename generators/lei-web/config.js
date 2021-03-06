const dependencies = [
  '@leizm/web',
  'erest',
  'ioredis',
  'lodash',
  'mysql',
  'pino',
  'pino-pretty',
  '@leizm/sql',
  'js-yaml',
];

const dependenciesTS = [
  '@types/ioredis',
  '@types/js-yaml',
  '@types/lodash',
  '@types/mysql',
  '@types/node',
  '@types/pino',
  '@types/debug',
];

const devDependencies = ['chai', 'debug', 'mocha', 'prettier', 'supertest', 'ts-node', 'typescript'];

const devDependenciesTS = ['@types/chai', '@types/mocha', '@types/prettier', '@types/supertest'];

exports.getTSDeps = () => {
  return [].concat(dependencies);
};

exports.getTSDevDeps = () => {
  return [].concat(devDependencies, dependenciesTS, devDependenciesTS);
};

exports.getJSDeps = () => {
  return dependencies;
};

exports.getJSDevDeps = () => {
  return devDependencies;
};

exports.updateIgnoreTS = [
  '**/*.gen.ts',
  '**/models/index.ts',
  '**/services/index.ts',
  '**/*.yaml',
  '**/routers/test.ts',
  '**/api/test-index.ts',
];

const fs = require('fs');
const utils = require('../../utils/utils');

function getGitOrigin(gitConfigFile) {
  try {
    const gitConfig = fs.readFileSync(gitConfigFile, 'utf-8');
    const m = gitConfig.match(/\s+url\s+=\s+(\S+)\s+/i);
    if (m) {
      return m[1].replace(/https?:\/\//, '').replace(/:/g, '/');
    }
  } catch (_err) {
    return;
  }
}
exports.getGitOrigin = getGitOrigin;

exports.prompts = function prompts() {
  const repo = getGitOrigin(this.destinationPath('./.git/config'));
  return [
    {
      type: 'list',
      name: 'language',
      message: 'Please choose Language:',
      choices: ['TypeScript'],
    },
    {
      name: 'name',
      message: 'package name:',
      default: this.appname && this.appname.replace(/\s/g, '-').replace('node-', ''),
      validate: input => {
        return !!input.match('^(?:@[a-z0-9-~][a-z0-9-._~]*/)?[a-z0-9-~][a-z0-9-._~]*$');
      },
    },
    {
      name: 'shortName',
      message: 'project short name:',
      default: this.appname && utils.shortName(this.appname),
    },
    {
      name: 'version',
      message: 'version:',
      default: '1.0.0',
      validate: input => {
        return !!input.match(/\d+\.\d+\.\d+/);
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'description:',
    },
    {
      name: 'author',
      default: `${this.user.git.name()} <${this.user.git.email()}>`,
      message: 'author',
    },
    {
      name: 'repo',
      default: repo,
      message: 'git repository:',
      filter: repo => {
        return repo
          .replace(/https?:\/\//, '')
          .replace(/^(.*?)@/, '')
          .replace(/.git$/, '');
      },
    },
    {
      name: 'keywords',
      message: 'keywords:',
      filter: words => {
        return words ? words.split(/\s+|,/g) : [''];
      },
    },
    {
      type: 'confirm',
      name: 'nyc',
      message: 'use nyc for test coverage ?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'lint',
      message: 'use lint-staged and commitlint ?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'docker',
      message: 'need add docker build ?',
      default: false,
    },
    {
      type: 'list',
      name: 'target',
      default: 'esnext',
      message: 'typescript target:',
      when: res => {
        return res.language === 'TypeScript';
      },
      choices: ['es5', 'es6', 'esnext'],
    },
    {
      type: 'list',
      name: 'license',
      default: 'ISC',
      message: 'license:',
      choices: ['ISC', 'MIT', 'Apache-2.0', 'AGPL-3.0'],
    },
  ];
};

exports.genPackage = (base, addtion) => {
  const pkg = {
    name: addtion.name,
    version: addtion.version,
    description: addtion.description,
    keywords: addtion.keywords,
    author: addtion.author,
    license: addtion.license,
  };
  Object.assign(pkg, base);
  if (addtion.repo) {
    pkg.repository = {
      type: 'git',
      url: `git+https://${addtion.repo}.git`,
    };
    pkg.bugs = {
      url: `https://${addtion.repo}/issues`,
    };
    pkg.homepage = `https://${addtion.repo}#readme`;
  }
  return pkg;
};

exports.nycInfo = {
  all: true,
  extension: ['.ts'],
  include: ['src'],
  reporter: ['html', 'text', 'text-summary'],
  exclude: ['src/models/base.ts', 'src/index.ts', 'src/global', '**/*.d.ts', '**/*.gen.ts'],
};

exports.lintInfo = {
  commitlint: {
    extends: ['@commitlint/config-conventional'],
  },
  husky: {
    hooks: {
      'pre-commit': 'lint-staged',
      'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS',
    },
  },
  'lint-staged': {
    '*.(ts)': ['npm run format', 'git add'],
  },
};

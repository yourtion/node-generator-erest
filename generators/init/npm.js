const fs = require('fs');

function getGitOrigin() {
  try {
    const gitConfig = fs.readFileSync('./.git/config', 'utf-8');
    const m = gitConfig.match(/\[remote\s+'origin']\s+url\s+=\s+(\S+)\s+/i);
    if (m) {
      return m[1];
    }
  } catch (_err) {
    return;
  }
}
exports.getGitOrigin = getGitOrigin;

exports.prompts = function prompts() {
  return [
    {
      type: 'list',
      name: 'language',
      message: 'Please choose Language:',
      choices: ['TypeScript', 'JavaScript'],
    },
    {
      name: 'name',
      message: 'project name:',
      default: this.appname,
    },
    {
      name: 'shortName',
      message: 'project short name:',
      default: this.appname,
    },
    {
      name: 'version',
      message: 'version:',
      default: '1.0.0',
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
      default: getGitOrigin(),
      message: 'git repository:',
      filter: words => {
        return words
          .replace(/https?:\/\//, '')
          .replace(/^(.*?)@/, '')
          .replace(/.git$/, '');
      },
    },
    {
      name: 'keywords',
      message: 'keywords',
      filter: words => {
        return words.split(/\s*,\s*/g);
      },
    },
    {
      type: 'list',
      name: 'license',
      default: 'MIT',
      message: 'license:',
      choices: ['MIT', 'ISC', 'Apache-2.0', 'AGPL-3.0'],
    },
  ];
};

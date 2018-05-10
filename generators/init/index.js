const Generator = require('yeoman-generator');

const { prompts } = require('./npm');
const utils = require('../../utils/utils');
const config = require('./config');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.language = '';
    this.prop = {};
  }

  prompting() {
    return this.prompt(prompts.call(this)).then(prop => {
      this.prop = prop;
      this.log('config: \n', JSON.stringify(prop, null, 2));
    });
  }

  writing() {
    this.fs.copy(this.templatePath('.gitignore'), this.destinationPath('.gitignore'));
    // if (this.language === 'TypeScript') {
    const packageInfo = this.fs.readJSON(this.templatePath('typescript/package.json'));
    const pkg = {
      name: this.prop.name,
      version: this.prop.version,
      description: this.prop.description,
      author: this.prop.author,
    };
    if (this.prop.repo) {
      packageInfo.repository = {
        type: 'git',
        url: `git+https://${this.prop.repo}.git`,
      };
      packageInfo.bugs = {
        url: `https://${this.prop.repo}/issues`,
      };
      packageInfo.homepage = `https://${this.prop.repo}#readme`;
    }
    this.fs.extendJSON(this.destinationPath('package.json'), Object.assign(pkg, packageInfo));
    this.fs.copy(this.templatePath('typescript/tsconfig.json'), this.destinationPath('tsconfig.json'));
    this.fs.copy(this.templatePath('typescript/(src|test)/**'), this.destinationPath('src'));
    const info = {
      sessionSecret: utils.randomStr(),
      projectNameShort: this.prop.shortName,
      projectName: this.prop.name,
    };
    for (const conf of ['base', 'dev', 'test']) {
      this.fs.copyTpl(
        this.templatePath(`typescript/config/${conf}.yaml`),
        this.destinationPath(`config/${conf}.yaml`),
        info
      );
    }
    // }
  }

  install() {
    this.npmInstall(config.getTSDeps(), { save: true, registry: 'https://registry.npm.taobao.org' });
    this.npmInstall(config.getTSDevDeps(), { 'save-dev': true, registry: 'https://registry.npm.taobao.org' });
  }
};

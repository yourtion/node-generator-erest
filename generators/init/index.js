const Generator = require('yeoman-generator');

const { prompts, genPackage } = require('./npm');
const utils = require('../../utils/utils');
const config = require('./config');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.isTS = false;
    this.isJS = false;
    this.lang = '';
    this.prop = {};
  }

  prompting() {
    return this.prompt(prompts.call(this)).then(prop => {
      this.prop = prop;
      this.lang = this.prop.language.toLocaleLowerCase();
      this.isTS = this.prop.language === 'TypeScript';
      this.isJS = this.prop.language === 'JavaScript';
      this.log(JSON.stringify(prop, null, 2));
    });
  }

  writing() {
    this.fs.copy(this.templatePath('.gitignore'), this.destinationPath('.gitignore'));
    const packageInfo = this.fs.readJSON(this.templatePath(this.lang + '/package.json'));
    this.fs.extendJSON(this.destinationPath('package.json'), genPackage(packageInfo, this.prop));
    if (this.isTS) {
      const info = {
        sessionSecret: utils.randomStr(),
        projectNameShort: this.prop.shortName,
        projectName: this.prop.name,
        target: this.prop.target,
      };
      this.fs.copy(this.templatePath('typescript/(src|test|scripts)/**'), this.destinationPath('src'));
      this.fs.copyTpl(this.templatePath('typescript/tsconfig.json'), this.destinationPath('tsconfig.json'), info);
      for (const conf of ['base', 'dev', 'test']) {
        this.fs.copyTpl(
          this.templatePath(`typescript/config/${conf}.yaml`),
          this.destinationPath(`config/${conf}.yaml`),
          info
        );
      }
    }
  }

  install() {
    if(this.isTS) {
      this.npmInstall(config.getTSDeps(), { save: true, registry: 'https://registry.npm.taobao.org' });
      this.npmInstall(config.getTSDevDeps(), { 'save-dev': true, registry: 'https://registry.npm.taobao.org' });
    }
    if(this.isJS) {
      this.npmInstall(config.getJSDeps(), { save: true, registry: 'https://registry.npm.taobao.org' });
      this.npmInstall(config.getJSDevDeps(), { 'save-dev': true, registry: 'https://registry.npm.taobao.org' });
    }
  }
};

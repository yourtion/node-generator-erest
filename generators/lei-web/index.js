const Generator = require('yeoman-generator');

const { prompts, genPackage, nycInfo } = require('./npm');
const utils = require('../../utils/utils');
const config = require('./config');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.isTS = false;
    this.isJS = false;
    this.isCov = false;
    this.isDocker = false;
    this.lang = '';
    this.prop = {};
  }

  prompting() {
    this.isExits = this.fs.exists(this.destinationPath('package.json'));
    if (this.isExits) {
      this.isTS = this.fs.exists(this.destinationPath('tsconfig.json'));
      return this.prompt({
        type: 'confirm',
        name: 'update',
        message: 'update project ?',
        default: true,
      }).then(prop => {
        if (!prop.update) return process.exit();
      });
    }
    return this.prompt(prompts.call(this)).then(prop => {
      this.prop = prop;
      this.isCov = this.prop.nyc;
      this.isDocker = this.prop.docker;
      this.lang = this.prop.language.toLocaleLowerCase();
      this.isTS = this.prop.language === 'TypeScript';
      this.isJS = this.prop.language === 'JavaScript';
      this.log(JSON.stringify(prop, null, 2));
    });
  }

  writing() {
    this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'));
    if (!this.isExits) {
      const packageInfo = this.fs.readJSON(this.templatePath(this.lang + '/package.json'));
      if (this.isCov) {
        packageInfo.nyc = nycInfo;
        packageInfo.scripts['test-cov'] = 'export NODE_ENV=test && nyc mocha test/api/test-*.ts';
      }
      this.fs.extendJSON(this.destinationPath('package.json'), genPackage(packageInfo, this.prop));
    }
    if (this.isDocker) {
      this.fs.copy(this.templatePath('docker'), this.destinationPath(''));
    }

    if (this.isTS) {
      const info = {
        sessionSecret: utils.randomStr(),
        main: 'dist/index.js',
        projectNameShort: this.prop.shortName,
        projectName: this.prop.name,
        target: this.prop.target,
      };
      const opt = !this.isExits ? {} : { globOptions: { ignore: config.updateIgnoreTS } };
      for (const dis of ['bin', 'src', 'test', 'scripts']) {
        this.fs.copy(this.templatePath(`typescript/${dis}`), this.destinationPath(dis), opt);
      }
      this.fs.copy(this.templatePath('typescript/.prettierrc.js'), this.destinationPath('.prettierrc.js'));

      if (this.isExits) return;
      this.fs.copyTpl(this.templatePath('typescript/tsconfig.temp.json'), this.destinationPath('tsconfig.json'), info);
      this.fs.copyTpl(this.templatePath('app.temp.json'), this.destinationPath('app.json'), info);
      for (const conf of ['base', 'dev', 'test']) {
        this.fs.copyTpl(
          this.templatePath(`typescript/config/${conf}.temp.yaml`),
          this.destinationPath(`config/${conf}.yaml`),
          info
        );
      }
    }
  }

  install() {
    const registry = 'https://registry.npm.taobao.org';
    if (this.isTS) {
      this.npmInstall(config.getTSDeps(), { save: true, registry });
      this.npmInstall(config.getTSDevDeps(), { 'save-dev': true, registry });
      if (this.isCov) {
        this.npmInstall(['source-map-support', 'nyc'], { 'save-dev': true, registry });
      }
    }
    if (this.isJS) {
      this.npmInstall(config.getJSDeps(), { save: true, registry });
      this.npmInstall(config.getJSDevDeps(), { 'save-dev': true, registry });
    }
    utils.mkdirSync(this.destinationPath('logs'));
    utils.mkdirSync(this.destinationPath('src', 'controllers'));
    utils.mkdirSync(this.destinationPath('docs'));
  }
};

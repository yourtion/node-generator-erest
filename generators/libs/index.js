const Generator = require('yeoman-generator');

const LIBS = ['jwt', 'xlsx', 'session'];

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.isTS = this.fs.exists(this.destinationPath('tsconfig.json'));
    this.lib = args[0];
    this.dep = [];
    this.devDep = [];
  }

  prompting() {
    return this.prompt([
      {
        type: 'list',
        name: 'lib',
        message: 'Please choose Libs:',
        choices: LIBS,
        when: () => !this.lib || !LIBS.includes(this.lib),
      },
    ]).then(prop => {
      this.prop = prop;
      this.lib = this.prop.lib || this.lib;
    });
  }

  writing() {
    let file;
    switch (this.lib) {
      case 'xlsx':
        file = 'xlsx.ts';
        this.dep.push('node-xlsx');
        break;
      case 'jwt':
        file = 'jwt.ts';
        this.dep.push('jsonwebtoken');
        this.devDep.push('@types/jsonwebtoken');
        break;
      case 'session':
        file = 'session.ts';
        break;
      default:
        break;
    }
    this.fs.copy(this.templatePath(`typescript/${file}`), this.destinationPath(`src/libs/${file}`));
  }

  install() {
    const registry = 'https://registry.npm.taobao.org';
    if (this.isTS) {
      if (this.dep.length > 0) {
        this.npmInstall(this.dep, { save: true, registry });
      }
      if (this.devDep.length > 0) {
        this.npmInstall(this.devDep, { 'save-dev': true, registry });
      }
    }
  }
};

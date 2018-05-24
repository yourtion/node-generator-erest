const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  help() {
    this.log.yellow('使用 erest:init 初始化项目');
  }

};

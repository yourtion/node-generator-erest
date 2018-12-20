const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  help() {
    this.log('使用 `yo erest:lei-web` 初始化项目');
    this.log('使用 `yo erest:code service xxx 测试` 初始化 Service');
    this.log('使用 `yo erest:code router xxx` 初始化 Router');
    this.log('使用 `yo erest:libs` 添加 Lib 插件');
  }
};

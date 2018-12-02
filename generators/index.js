const Generator = require('yeoman-generator');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  help() {
    this.log.yellow('使用 `erest:init lei-web` 初始化项目');
    this.log.yellow('使用 `yo erest:code service demo Demo服务` 初始化 Service');
    this.log.yellow('使用 `yo erest:code router xxx` 初始化 Router');
  }
};

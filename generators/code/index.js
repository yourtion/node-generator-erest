const Generator = require('yeoman-generator');
const utils = require('../../utils/utils');

const TYPES = ['Service', 'Router'];

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.isTS = this.fs.exists(this.destinationPath('tsconfig.json'));
    this.type = args[0] && utils.firstUpperCase(args[0]);
    this.name = args[1];
    this.cnName = args[2];
  }

  prompting() {
    return this.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Please choose Types:',
        choices: TYPES,
        when: () => !this.type || !TYPES.includes(this.type),
      },
      {
        name: 'name',
        message: res => `Please input ${this.type || res.type}'s name:`,
        when: () => !this.name,
        validate: v => !!v,
      },
      {
        name: 'cnName',
        message: res => `Please input ${this.type || res.type}'s Comment name:`,
        when: res => (this.type || res.type) === 'Service' && !this.cnName,
      },
    ]).then(prop => {
      this.prop = prop;
      this.type = this.prop.type || this.type;
      this.name = this.prop.name || this.name;
      this.cnName = this.prop.cnName || this.cnName;
      // this.log(JSON.stringify(prop, null, 2));
    });
  }

  writing() {
    this.type = this.type.toLocaleLowerCase();
    const filename = utils.toSnakeCase(this.name);
    const name = utils.firstUpperCase(utils.underscore2camelCase(this.name));
    if (this.type === 'service') {
      this.fs.copyTpl(
        this.templatePath('typescript/service.ts.temp'),
        this.destinationPath(`src/services/${filename}.s.ts`),
        { name, cnName: this.cnName }
      );
    }
    if (this.type === 'router') {
      this.fs.copyTpl(
        this.templatePath('typescript/router.ts.temp'),
        this.destinationPath(`src/routers/${filename}.r.ts`),
        { name }
      );
    }
  }
};

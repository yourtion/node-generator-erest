const helpers = require('yeoman-test');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

it('generate erest lei-web', async function () {
  this.timeout(120 * 1000);
  const generate = path.join(__dirname, '../generators/lei-web');
  const dir = await helpers.run(generate).withPrompts({
    language: 'TypeScript',
    name: 'demo',
    shortName: 'demo',
    version: '1.0.0',
    description: '',
    author: 'YourtionGuo <yourtion@gmail.com>',
    repo: '',
    keywords: 'erest, demo, yourtion',
    nyc: false,
    lint: true,
    docker: false,
    target: 'esnext',
    license: 'MIT',
  });

  console.log(dir);
  const { stdout, stderr } = await exec(`cd ${dir} && cat package.json`);
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
});

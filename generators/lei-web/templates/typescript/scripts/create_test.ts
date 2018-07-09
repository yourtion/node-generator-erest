/**
 * 创建测试
 * @author Yourtion Guo <yourtion@gmail.com>
 */

/* tslint:disable: no-console */

import Debug from "debug";
import path from "path";
import util from "util";

const debug = Debug("erest:test:");

const FILE_PATH = path.resolve(__dirname, "../test/api/");

require("../src/app");
import apiService from "./api";
import { prettierSaveFile } from "./utils";

function genIt(api: string, method: string, input: Record<string, any>, desc: string) {
  return `
  it('${desc}', async () => {
    const ret = await agent.${method}('/api${api}')
      .input(${util.inspect(input, false, 2).replace(/'/g, "")})
      .takeExample('${desc}')
      .success();
    assert.equal(ret, '操作成功');
  });
`;
}

function genFile(name: string, lines: string[]) {
  return `import { assert } from "chai";

import apiService from "./init";
const agent = apiService.test.session();
const shareData = apiService.shareTestData.data;

const share = Object.assign({
}, shareData.core, shareData.${name});


describe('API - ${name}', () => {
${lines.join("\n")}
});`;
}

function genTest(name: string, overwrite: boolean) {
  const schemas = apiService.api.$schemas;
  debug(name);
  const data: Record<string, any>[] = [];
  for (const s of schemas.values()) {
    if (s && s.options && s.options.group && s.options.group.toLowerCase() === name) {
      data.push(s);
    }
  }
  if (data.length === 0) {
    throw new Error(`找不到组 ${name} 的数据`);
  }
  const res: string[] = [];
  data.forEach(schema => {
    const opt = schema.options;
    const input: Record<string, any> = {};
    [...Object.keys(opt.query), ...Object.keys(opt.body)].forEach(key => {
      input[key] = "share." + key;
    });
    res.push(genIt(schema.key.split("_")[1], opt.method, input, opt.title));
  });
  const str = genFile(name, res);
  const filePath = `${FILE_PATH}/test-${name}.ts`;
  return prettierSaveFile(filePath, str, overwrite);
}

debug(process.argv);

if (process.argv.length > 2) {
  genTest(process.argv[2].toLowerCase(), !!process.argv[3])
    .then(() => {
      console.log(`创建test ${process.argv[2]}成功`);
      process.exit(0);
    })
    .catch(err => {
      console.log(err.message);
      process.exit(-1);
    });
} else {
  console.log("node creare_test.ts groupName");
  process.exit(-1);
}

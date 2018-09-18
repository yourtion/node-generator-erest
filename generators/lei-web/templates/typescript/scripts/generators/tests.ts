/**
 * 创建测试
 * @author Yourtion Guo <yourtion@gmail.com>
 */

require("../../src/app");
import apiService from "../../src/api";
import { firstUpperCase, underscore2camelCase, firstLowerCase } from "../../src/global/base/utils";

const interfaces: string[] = [];
const lines: string[] = [];

function genIt(key: string, method: string, desc: string, params: string[]) {
  const k = key.replace(/\//g, "_").replace(/:/g, "_");
  const n = firstUpperCase(underscore2camelCase(k));
  const name = firstLowerCase(underscore2camelCase(k));
  const inte = `IParams${n}`;
  // const schema = {};
  interfaces.push(inte);
  const path = key.substring(key.indexOf("_") + 1).replace(/:(\w+)/, "${input!.$1}");
  return `
  /** ${desc} */
  ${name}Raw(input?: ${inte}, example?: string) {
    return this.${method}(\`/api${path}\`, input, example, ${JSON.stringify(params)});
  }
  /** ${desc}（成功） */
  ${name}Ok(input?: ${inte}, example?: string) {
    return this.${name}Raw(input, example).success()
  }
  /** ${desc}（出错） */
  ${name}Err(input?: ${inte}, example?: string) {
    return this.${name}Raw(input, example).error()
  }
  /** ${desc} (检查参数) */
  async ${name}Verify(input?: ${inte}, example?: string) {
    const ret = await this.${name}Ok(input, example);
    const opt = this.api.api.$apis.get("${key}")!.options;
    const schema = opt.responseSchema || opt.response;
    return this.verifyOutput(ret, schema);
  }
`;
}

function genFile() {
  return `
import TestAgent from "../agent";
import { ${interfaces.join(", ")}} from "../../src/global"

export default class APITest<T> extends TestAgent<T> {
  ${lines.join("\n")}
}`;
}

export function genTest() {
  const schemas = apiService.api.$apis;
  for (const schema of schemas.values()) {
    const opt = schema.options;
    lines.push(genIt(schema.key, opt.method, opt.title, Object.keys(opt.params || {})));
  }
  return genFile();
}

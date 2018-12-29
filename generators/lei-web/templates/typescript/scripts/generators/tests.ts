/**
 * 创建测试
 * @author Yourtion Guo <yourtion@gmail.com>
 */

require("../../src/app");
import apiService from "../../src/api";
import { firstUpperCase, underscore2camelCase, firstLowerCase } from "../../src/global/base/utils";

const interfaces: string[] = [];
const response: string[] = [];
const lines: string[] = [];

function genIt(key: string, method: string, desc: string, params: string[]) {
  const k = key.replace(/\//g, "_").replace(/:/g, "_");
  const n = firstUpperCase(underscore2camelCase(k));
  const name = firstLowerCase(underscore2camelCase(k));
  const inte = `IParams${n}`;
  const resp = `IResponse${n}`;
  // const schema = {};
  interfaces.push(inte);
  response.push(resp);
  const path = key.substring(key.indexOf("_") + 1).replace(/:(\w+)/, "${input!.$1}");
  const basePath = apiService.privateInfo.info.basePath;
  return `
  /** ${desc} */
  ${name}Raw(input?: ${inte}, example?: string, headers?: Record<string, any>) {
    const req = this.${method}(\`${basePath}${path}\`, input, example, ${JSON.stringify(params)});
    if(headers) req.headers(headers);
    return req;
  }
  /** ${desc}（成功） */
  ${name}Ok(input?: ${inte}, example?: string, headers?: Record<string, any>): Promise<${resp}> {
    return this.${name}Raw(input, example, headers).success()
  }
  /** ${desc}（出错） */
  ${name}Err(input?: ${inte}, example?: string, headers?: Record<string, any>): Promise<IError> {
    return this.${name}Raw(input, example, headers).error()
  }
  /** ${desc} (检查参数) */
  async ${name}Verify(input?: ${inte}, example?: string, headers?: Record<string, any>): Promise<${resp}> {
    const ret = await this.${name}Ok(input, example, headers);
    const opt = this.api.api.$apis.get("${key}")!.options;
    const schema = opt.responseSchema || opt.response;
    return this.verifyOutput(ret, schema);
  }
`;
}

function genFile() {
  return `
import TestAgent from "../agent";
import { ${interfaces.join(", ")} ,${response.join(", ")}} from "../../src/global"

export interface IError {
  ok: boolean;
  error_code: number;
  message: string;
  msg: string;
}

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

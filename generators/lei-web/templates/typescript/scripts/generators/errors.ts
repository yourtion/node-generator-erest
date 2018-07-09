/**
 * @file 错误类生成
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import apiService from "../../src/api";
import { firstUpperCase, underscore2camelCase } from "../../src/global/base/utils";

function genErrorString(err) {
  const name = firstUpperCase(underscore2camelCase(err.name));
  return `
/**
 * ${err.name} - ${err.description}
 */
export class ${name} extends Error {
  public code = ${err.code};
  public description = "${err.description}";
  public name = "${err.name}";
  public show = ${err.isShow};
  public log = ${err.isLog};
  public msg: string;

  constructor(message?: string) {
    super(message ? "${err.description} : " + message : "${err.description}");
    this.msg = message || "${err.description}" ;
  }
}
`;
}

export function genErrorFile() {
  const res = [`/* tslint:disable: max-classes-per-file */\n`];
  apiService.errors.forEach(v => res.push(genErrorString(v)));
  return res.join("\n");
}

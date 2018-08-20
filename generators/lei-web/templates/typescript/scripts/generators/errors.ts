/**
 * @file 错误类生成
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import apiService from "../../src/api";
import { firstUpperCase, underscore2camelCase } from "../../src/global/base/utils";

const ierror = `
/** 自定义错误 */
export interface IError {
  /** 错误码 */
  code: number;
  /** 描述 */
  description: string;
  /** 错误名 */
  name: string;
  /** 是否显示 */
  show: boolean;
  /** 是否输出日志 */
  log: boolean;
  /** 错误信息 */
  msg: string;
}
`;

function genErrorString(err) {
  const name = firstUpperCase(underscore2camelCase(err.name));
  return `
/** ${err.name} - ${err.description} */
export class ${name} extends Error implements IError {
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
  const res = [`/* tslint:disable: max-classes-per-file */\n`, ierror];
  apiService.errors.forEach(v => res.push(genErrorString(v)));
  return res.join("\n");
}

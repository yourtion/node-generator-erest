/**
 * @file API 扩展
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import { utils } from "./base";

/**
 * 参数构造
 *
 * @param {String} type 参数类型
 * @param {String} comment 参数说明
 * @param {any} required 是否必填
 * @param {any} defaultValue 默认值
 * @return {Object}
 */
export function build(type: string, comment: string, required?: boolean, defaultValue?: any, params?: any) {
  return utils.removeUndefined({ type, comment, required, default: defaultValue, params });
}

export function requireParam(schema: object) {
  return Object.assign({ required: true }, schema);
}

/**
 * 分页默认模版
 */
export const PAGEING = Object.freeze({
  page: { type: "Integer", comment: "第n页", default: 1 },
  page_count: {
    type: "Integer",
    comment: "每页数量（默认30）",
    default: 30,
  },
  order: { type: "String", comment: "排序字段（默认id）" },
  asc: { type: "Boolean", comment: "是否升序（默认false）" },
});

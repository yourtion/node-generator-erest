/**
 * @file 配置生成
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import config from "../../src/global/base/config";
import { firstUpperCase } from "../../src/global/base/utils";

const result = [];

function toInterface(obj, name) {
  const res = [];
  res.push(`export interface I${firstUpperCase(name)} {`);
  if (name === "config") {
    res.push("[key: string]: any;");
  }
  for (const k in obj) {
    if (typeof obj[k] === "object") {
      if (Array.isArray(obj[k])) {
        res.push(`  ${k} : ${typeof obj[k][0]}[];`);
      } else {
        res.push(`  ${k}: I${firstUpperCase(k)};`);
        toInterface(obj[k], k);
      }
    } else {
      res.push(`  ${k} : ${typeof obj[k]};`);
    }
  }
  res.push("}");
  result.push(res.join("\n"));
}

export function genConfigFile() {
  toInterface(config, "config");
  return result.join("\n\n");
}

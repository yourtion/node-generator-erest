/**
 * @file 配置生成
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import fs from "fs";
import path from "path";
import config from "../../src/global/base/config";
import { firstUpperCase } from "../../src/global/base/utils";

const result = [];
const conf: Record<string, string> = {};

function getConfigComment() {
  const configFile = fs.readFileSync(path.resolve(__dirname, "../../config/base.yaml"));
  const strs = configFile.toString().split("\n");
  for (const line of strs) {
    const keys = line.split(":", 1);
    const key = keys && keys[0];
    const comments = line.split("#");
    const comment = comments && comments.length > 1 && comments[1];
    if (comment && key[0] !== " ") {
      conf[key] = comment.trim();
    }
  }
  return conf;
}

function toInterface(obj, name) {
  const res = [];
  res.push(`export interface I${firstUpperCase(name)} {`);
  if (name === "config") {
    res.push("[key: string]: any;");
  }
  for (const k in obj) {
    if (name === "config" && conf[k]) {
      res.push(`/** ${conf[k]} */`);
    }
    if (typeof obj[k] === "object") {
      if (Array.isArray(obj[k])) {
        console.log(name);
        if (name === "config") {
          res.push(`  ${k}: I${firstUpperCase(k)}[];`);
          toInterface(obj[k][0], k);
        } else {
          res.push(`  ${k} : ${typeof obj[k][0]}[];`);
        }
      } else {
        if (name === "config") {
          res.push(`  ${k}: I${firstUpperCase(k)};`);
          toInterface(obj[k], k);
        } else {
          res.push(`  ${k} : ${typeof obj[k]};`);
        }
      }
    } else {
      res.push(`  ${k} : ${typeof obj[k]};`);
    }
  }
  res.push("}");
  result.push(res.join("\n"));
}

export function genConfigFile() {
  getConfigComment();
  toInterface(config, "config");
  return result.join("\n\n");
}

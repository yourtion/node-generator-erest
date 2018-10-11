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

/** 获取配置名 */
function confName(sco, key, n = 1) {
  return sco ? `${sco}${"^".repeat(n)}${firstUpperCase(key)}` : firstUpperCase(key);
}

/** 往上n级 */
function splitLast(scope, n = 1) {
  return scope
    .split("^")
    .slice(0, -1 * n)
    .join("^");
}

function getConfigComment() {
  const configFile = fs.readFileSync(path.resolve(__dirname, "../../config/base.yaml"));
  const strs = configFile.toString().split("\n");
  let scope = "";
  let ll = 0;
  let comm = "";
  for (const line of strs) {
    const keys = line.split(":");
    const key = keys && keys[0];
    const commentIdx = line.indexOf("#");
    const keyIdx = line.indexOf(":");
    const comment = commentIdx > -1 && line.substring(commentIdx + 1);
    if (keys.length < 2) {
      if (comment && (keyIdx < 0 || keyIdx < commentIdx)) comm = comment;
      continue;
    }
    const rKey = key.trim();
    const l = key.length - rKey.length;
    if (l === 0) {
      // 处理第一级情况
      scope = confName("", rKey);
    } else if (l > ll) {
      // 深入n层
      scope = confName(scope, rKey, (l - ll) / 2);
    } else if (l <= ll) {
      // 同级或退出n层
      scope = confName(splitLast(scope, (ll - l) / 2 + 1), rKey);
    }
    ll = l;
    if (comment || comm) {
      const c = comment || comm;
      conf[scope.replace(/\^/g, "")] = c.trim();
      if (comm) comm = "";
    }
  }
  // console.log(conf);
  return conf;
}

function getName(name: string, k: string) {
  if (name === "config") return firstUpperCase(k);
  return firstUpperCase(name) + firstUpperCase(k);
}

function toInterface(obj, name) {
  const res = [];
  res.push(`export interface I${firstUpperCase(name)} {`);
  if (name === "config") {
    res.push("[key: string]: any;");
  }
  for (const k in obj) {
    // console.log(name, k, getName(name, k), conf[getName(name, k)]);
    if (conf[getName(name, k)]) {
      res.push(`/** ${conf[getName(name, k)]} */`);
    }
    if (typeof obj[k] === "object") {
      if (Array.isArray(obj[k])) {
        if (typeof obj[k][0] === "object") {
          res.push(`  ${k}: I${getName(name, k)}[];`);
          toInterface(obj[k][0], getName(name, k));
        } else {
          res.push(`  ${k} : ${typeof obj[k][0]}[];`);
        }
      } else {
        res.push(`  ${k}: I${getName(name, k)};`);
        toInterface(obj[k], getName(name, k));
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

/**
 * @file 辅助函数
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import { createHash, randomBytes, createCipher, createDecipher } from "crypto";
import { exists, readFile, writeFile } from "fs";
import { format, parse } from "url";
import { promisify } from "util";

const NUMBER = "0123456789";
const NUMBERL = NUMBER.length;
const CHARTS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CHARTSL = CHARTS.length;

/** leftPad */
export function leftPad(n: any, c: number) {
  let res = String(n);
  while (res.length < c) {
    res = "0" + res;
  }
  return res;
}

/** MD5 */
export function md5(str: string) {
  return createHash("md5")
    .update(str)
    .digest("hex");
}

/** 深度冻结对象 */
export function deepFreeze(o: any) {
  Object.freeze(o);

  const oIsFunction = typeof o === "function";
  const hasOwnProp = Object.prototype.hasOwnProperty;

  Object.getOwnPropertyNames(o).forEach(function(prop) {
    if (
      hasOwnProp.call(o, prop) &&
      (oIsFunction ? prop !== "caller" && prop !== "callee" && prop !== "arguments" : true) &&
      o[prop] !== null &&
      (typeof o[prop] === "object" || typeof o[prop] === "function") &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });

  return o;
}

/* 转换 Unix 时间戳到 MySQL */
export function unixTime(unixtime: number) {
  const u = new Date(unixtime);
  return (
    u.getUTCFullYear() +
    "-" +
    leftPad(u.getUTCMonth() + 1, 2) +
    "-" +
    leftPad(u.getUTCDate(), 2) +
    " " +
    leftPad(u.getUTCHours(), 2) +
    ":" +
    leftPad(u.getUTCMinutes(), 2) +
    ":" +
    leftPad(u.getUTCSeconds() + 1, 2) +
    "." +
    leftPad((u.getUTCMilliseconds() / 1000).toFixed(3), 3)
  );
}

/** 生成 RequestID */
export function createRequestId(): string {
  return (
    Date.now().toString(32) +
    Math.random()
      .toString(32)
      .slice(2) +
    Math.random()
      .toString(32)
      .slice(2)
  );
}

/** 获取 timestamp */
export function genTimestamp(after = 0) {
  const now = new Date();
  return parseInt(String((now.getTime() + after * 1000) / 1000), 10);
}

/** 获取日期字符串 */
export function getDateString(pad = "", time = new Date()) {
  return `${time.getFullYear()}${pad}${leftPad(time.getMonth() + 1, 2)}${pad}${leftPad(time.getDate(), 2)}`;
}

/** 获取时间字符串 */
export function getTimeString(pad = "", time = new Date()) {
  return `${time.getHours()}${pad}${leftPad(time.getMinutes(), 2)}${pad}${leftPad(time.getSeconds(), 2)}`;
}

/** 获取日期时间字符串（2018-01-01 12:30:59） */
export function getDateTimeString(pad = " ", time = new Date()) {
  return `${getDateString("-", time)}${pad}${getTimeString(":", time)}`;
}

/** 今天的日期整数表示：20180913 */
export function dateNumber(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return Number(y + (m < 10 ? "0" : "") + m + (d < 10 ? "0" : "") + d);
}

/** 时间字符串（20180427） */
export function dateString(date = new Date()) {
  return getDateString("", date);
}

/** 获取中文字符串（2018年04月27日 16:42） */
export function dateTimeChinese(date = new Date()) {
  return (
    date.getFullYear() +
    "年" +
    leftPad(date.getMonth() + 1, 2) +
    "月" +
    leftPad(date.getDate(), 2) +
    "日 " +
    leftPad(date.getHours(), 2) +
    ":" +
    leftPad(date.getMinutes(), 2)
  );
}

/** 生成随机数（系统调用） */
export function randomStringSync(num: number) {
  return randomBytes(num)
    .toString("hex")
    .substr(0, num);
}

const randomBytesAsync = promisify(randomBytes);
/** 生成随机数（系统调用） */
export function randomStringAsync(num: number) {
  return randomBytesAsync(num).then(res => res.toString("hex").substr(0, num));
}

/** 返回随机字符串 */
export function randomString(length: number) {
  const str = [];
  for (let i = 0; i < length; i++) {
    str.push(CHARTS.charAt(Math.floor(Math.random() * CHARTSL)));
  }
  return str.join("");
}

/** 返回随机数字 */
export function randomNumber(length: number) {
  const str = [];
  for (let i = 0; i < length; i++) {
    str.push(NUMBER.charAt(Math.floor(Math.random() * NUMBERL)));
  }
  return str.join("");
}

/** 格式化请求中的 Boolean 类型 */
export function parseQueryBoolean(query: any, b: boolean) {
  const str = String(query);
  if (str === "1" || str === "true" || str === "yes" || str === "on") {
    return true;
  } else if (str === "0" || str === "false" || str === "no" || str === "off") {
    return false;
  }
  return b;
}

/** 删除对象中的 undefined */
export function removeUndefined(object: any) {
  Object.keys(object).forEach(key => object[key] === undefined && delete object[key]);
  return object;
}

/**
 * 合并URL
 * @param {String} dist 目标URL
 * @param {Object} query 附加 query 对象
 * @param {String} hash hash 参数
 */
export function mergeUrl(dist: string, query: any, hash: string) {
  const distUrl = parse(dist, true);
  delete distUrl.search;
  Object.assign(distUrl.query, query);
  distUrl.hash = hash;
  return format(distUrl);
}

/** 首字母大写 */
export function firstUpperCase(str: string) {
  return str.replace(/^\S/, s => s.toUpperCase());
}

/** 首字母小写 */
export function firstLowerCase(str: string) {
  return str.replace(/^\S/, s => s.toLowerCase());
}

/** 下划线转驼峰 */
export function underscore2camelCase(str: string) {
  return str
    .replace(/^[_.\- ]+/, "")
    .toLowerCase()
    .replace(/[_.\- ]+(\w|$)/g, (m, p1) => p1.toUpperCase());
}

/**
 * 参数检查
 * @param {Object} data 数据
 * @param {Array} keys 数据key
 */
export function checkParams(data: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    if (data[key] === undefined) return `"${key}" is required`;
  }
  return false;
}

/**
 * 参数提取
 * @param {Record<string, any>} data 数据
 * @param {Array} keys 数据key
 */
export function filterParams(data: Record<string, any>, keys: string[]) {
  const obj: Record<string, any> = {};
  keys.forEach(key => {
    if (data[key] !== undefined) obj[key] = data[key];
  });
  return obj;
}

/**
 * 渲染模版字符串
 * @param {String} template 模版字符串
 * @param {Record<string, any>} context 替换对象
 *
 * @example
 *
 * render("{{name}}很厉害，才{{age}}岁", { name: "yourtion", age: "15" })
 * // => yourtion很厉害，才15岁
 *
 */
export function render(template: string, context: Record<string, any>) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => context[key]);
}

const RATE = Symbol("RATE");
const START = Symbol("START");
const END = Symbol("END");
export interface IGift extends Record<string | symbol, any> {
  [RATE]: number;
  [START]: number;
  [END]: number;
}

/** 抽奖 */
export function lottory<T extends Record<string, any>>(gifts: T[], key = "rate"): T | null {
  const arr: Array<IGift & T> = [];
  let total = 0;
  gifts.forEach(gift => {
    const newGift = Object.assign({ [START]: total, [RATE]: gift[key], [END]: total }, gift);
    total += gift[key];
    newGift[END] = total;
    arr.push(newGift);
  });
  const random = Math.random() * total;
  for (const gift of arr) {
    if (gift[START] <= random && gift[END] > random) {
      return gift as T;
    }
  }
  return null;
}

/** 等待函数 */
export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/** 第几周（[2018, 5]）ISO 8601 */
export function getWeekNumber(day = new Date()) {
  // 拷贝一份时间防止修改到参数
  const d = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
  // 获取最近的 Thursday: current date + 4 - current day number
  // 将周日设置为第7天
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // 获取新年第一天
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // 计算两个 Thursday 之间的差
  const weekNo = Math.ceil(((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}

/** 今年周数（201805） */
export function getYearAndWeek(day = new Date()) {
  const week = getWeekNumber(day);
  return `${week[0]}${leftPad(week[1], 2)}`;
}

/** aes128加密 */
export function encodeAes128(str: string, secret: string) {
  const cipher = createCipher("aes128", secret);
  let encrypted = cipher.update(str, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

/** aes128解密 */
export function decodeAes128(hash: string, secret: string) {
  const decipher = createDecipher("aes128", secret);
  let decrypted = decipher.update(hash, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/** 判断一个文件是否xlsx */
export function isXlsx(fileName: string) {
  return /.*\.xlsx$/.test(fileName);
}

/** csv字符串解析 */
export function csvStringParser(str: any, sep = ",") {
  const c = new RegExp(sep, "g");
  const q = new RegExp('"', "g");
  const n = new RegExp(/\n|\r/, "g");
  let item = str;
  if (str === 0) {
    return "0";
  } else if (str === undefined || str === null) {
    return "";
  }
  if (typeof item !== "string") {
    const s = item.toString();
    if (s === "[object Object]") {
      item = JSON.stringify(item);
      if (item === "{}") {
        return "";
      }
    } else {
      item = s;
    }
  }
  if (item.search(c) >= 0 || item.search(q) >= 0 || item.search(n) >= 0) {
    return '"' + item.replace(q, '""').replace(n, "") + '"';
  }
  return item + "";
}

export const existsAsync = promisify(exists);
export const readFileAsync = promisify(readFile);
export const writeFileAsync = promisify(writeFile);

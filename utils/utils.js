const fs = require('fs');

/** 首字母大写 */
function firstUpperCase(str) {
  return str.replace(/^\S/, s => s.toUpperCase());
}
exports.firstUpperCase = firstUpperCase;

/** 下划线转驼峰 */
function underscore2camelCase(str) {
  return str
    .replace(/^[_.\- ]+/, '')
    .toLowerCase()
    .replace(/[_.\- ]+(\w|$)/g, (m, p1) => p1.toUpperCase());
}
exports.underscore2camelCase = underscore2camelCase;

/** 获取短名字 */
function shortName(str) {
  return toSnakeCase(str)
    .replace(/_/g, '-')
    .replace(/--/g, '-')
    .split('-')
    .map(s => s[0])
    .join('');
}
exports.shortName = shortName;

/** 蛇形命名 */
function toSnakeCase(str) {
  return str
    .replace(/(?:^|\.?)([A-Z])/g, (x, y) => {
      return '_' + y.toLowerCase();
    })
    .replace(/^_/, '');
}
exports.toSnakeCase = toSnakeCase;

/** 随机字符串 */
function randomStr() {
  return Math.random()
    .toString(36)
    .replace('0.', '');
}
exports.randomStr = randomStr;

/** 创建目录 */
function mkdirSync(dirPath) {
  try {
    fs.mkdirSync(dirPath);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}
exports.mkdirSync = mkdirSync;

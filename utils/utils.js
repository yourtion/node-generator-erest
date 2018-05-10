/**
 * 首字母大写
 */
function firstUpperCase(str) {
  return str.replace(/^\S/, s => s.toUpperCase());
}
exports.firstUpperCase = firstUpperCase;

/**
 * 下划线转驼峰
 */
function underscore2camelCase(str) {
  return str
    .replace(/^[_.\- ]+/, '')
    .toLowerCase()
    .replace(/[_.\- ]+(\w|$)/g, (m, p1) => p1.toUpperCase());
}
exports.underscore2camelCase = underscore2camelCase;

function toSnakeCase(str) {
  return str
    .replace(/(?:^|\.?)([A-Z])/g, (x, y) => {
      return '_' + y.toLowerCase();
    })
    .replace(/^_/, '');
}
exports.toSnakeCase = toSnakeCase;

function randomStr() {
  return Math.random()
    .toString(36)
    .replace('0.', '');
}
exports.randomStr = randomStr;

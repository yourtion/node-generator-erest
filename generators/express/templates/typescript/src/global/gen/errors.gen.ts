/* tslint:disable: max-classes-per-file */

/**
 * INTERNAL_ERROR - 内部错误
 */
export class InternalError extends Error {
  public code = -1000;
  public description = "内部错误";
  public name = "INTERNAL_ERROR";
  public show = true;
  public log = true;
  public msg: string;

  constructor(message?: string) {
    super(message ? "内部错误 : " + message : "内部错误");
    this.msg = message || "内部错误";
  }
}

/**
 * MISSING_PARAMETER - 缺少参数
 */
export class MissingParameter extends Error {
  public code = -1001;
  public description = "缺少参数";
  public name = "MISSING_PARAMETER";
  public show = true;
  public log = false;
  public msg: string;

  constructor(message?: string) {
    super(message ? "缺少参数 : " + message : "缺少参数");
    this.msg = message || "缺少参数";
  }
}

/**
 * INVALID_PARAMETER - 参数不合法
 */
export class InvalidParameter extends Error {
  public code = -1002;
  public description = "参数不合法";
  public name = "INVALID_PARAMETER";
  public show = true;
  public log = false;
  public msg: string;

  constructor(message?: string) {
    super(message ? "参数不合法 : " + message : "参数不合法");
    this.msg = message || "参数不合法";
  }
}

/**
 * PERMISSIONS_ERROR - 权限不足
 */
export class PermissionsError extends Error {
  public code = -1003;
  public description = "权限不足";
  public name = "PERMISSIONS_ERROR";
  public show = true;
  public log = true;
  public msg: string;

  constructor(message?: string) {
    super(message ? "权限不足 : " + message : "权限不足");
    this.msg = message || "权限不足";
  }
}

/**
 * DATABASE_ERROR - 数据库错误
 */
export class DatabaseError extends Error {
  public code = -1004;
  public description = "数据库错误";
  public name = "DATABASE_ERROR";
  public show = false;
  public log = true;
  public msg: string;

  constructor(message?: string) {
    super(message ? "数据库错误 : " + message : "数据库错误");
    this.msg = message || "数据库错误";
  }
}

/**
 * NOT_FOUND_ERROR - 找不到内容
 */
export class NotFoundError extends Error {
  public code = -1005;
  public description = "找不到内容";
  public name = "NOT_FOUND_ERROR";
  public show = true;
  public log = false;
  public msg: string;

  constructor(message?: string) {
    super(message ? "找不到内容 : " + message : "找不到内容");
    this.msg = message || "找不到内容";
  }
}

/**
 * REPEAT_ERROR - 该记录已经存在
 */
export class RepeatError extends Error {
  public code = -1007;
  public description = "该记录已经存在";
  public name = "REPEAT_ERROR";
  public show = true;
  public log = false;
  public msg: string;

  constructor(message?: string) {
    super(message ? "该记录已经存在 : " + message : "该记录已经存在");
    this.msg = message || "该记录已经存在";
  }
}

/**
 * EXCE_INVALID_ERROR - 不合法执行
 */
export class ExceInvalidError extends Error {
  public code = -1008;
  public description = "不合法执行";
  public name = "EXCE_INVALID_ERROR";
  public show = true;
  public log = false;
  public msg: string;

  constructor(message?: string) {
    super(message ? "不合法执行 : " + message : "不合法执行");
    this.msg = message || "不合法执行";
  }
}

/**
 * DEPEND_ERROR - 数据存在依赖
 */
export class DependError extends Error {
  public code = -1009;
  public description = "数据存在依赖";
  public name = "DEPEND_ERROR";
  public show = true;
  public log = false;
  public msg: string;

  constructor(message?: string) {
    super(message ? "数据存在依赖 : " + message : "数据存在依赖");
    this.msg = message || "数据存在依赖";
  }
}

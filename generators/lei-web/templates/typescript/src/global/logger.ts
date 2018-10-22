/**
 * @file 日志类
 * @author Yourtion Guo <yourtion@gmail.com>
 */

/* tslint:disable:unified-signatures */
import { createWriteStream } from "fs";
import pino from "pino";
import { Writable } from "stream";
import { config } from "./base";

// 修正在 watch 模式下 MaxListenersExceededWarning
if (!config.ispro) {
  process.stdout.setMaxListeners(Infinity);
}

/**
 * 日志接口
 *
 * 级别排序为：TRACE < DEBUG < INFO < WARN < ERROR < FATAL。默认级别为DEBUG。
 * 开发环境中开TRACE，在线上环境开INFO
 */
export interface ILogger {
  /**
   * 追踪
   *
   * 输出详尽的调试信息，只是开发阶段使用
   */
  trace(format: Error | object | any, ...params: any[]): void;
  /**
   * 调试
   *
   * 用于细粒度信息事件，调试程序的时候需要的关注的事情
   */
  debug(format: Error | object | any, ...params: any[]): void;
  /**
   * 信息
   *
   * 突出强调应用程序的运行过程，或者用于记录程序运行状态
   * （如：mysql 执行）
   */
  info(format: Error | object | any, ...params: any[]): void;
  /**
   * 警告
   *
   * 出现潜在错误的情形，但是错误为预料之内，已经被捕获处理
   * （如：外部请求出错、数据库慢查询）
   */
  warn(format: Error | object | any, ...params: any[]): void;
  /**
   * 错误
   *
   * 虽然发生错误事件，但仍然不影响系统的继续运行，但是需要引起重视的
   * （如：请求返回预期外的结果）
   */
  error(format: Error | object | any, ...params: any[]): void;
  /**
   * 严重错误
   *
   * 错误事件将会导致应用程序的退出
   * （一般不使用，因为程序在最外层做了错误捕获）
   */
  fatal(format: Error | object | any, ...params: any[]): void;
}

const defaultLevel = config.logLevel || (config.ispro ? "info" : "trace");

function getStream(path: string) {
  const fileStream = createWriteStream(path, { flags: "a+" });
  if (!config.loggerDebug) {
    return fileStream;
  }
  return new Writable({
    write(chunk, encoding, callback) {
      process.stdout.write(chunk);
      fileStream.write(chunk, encoding, callback);
    },
  });
}

// 在 PM2 以 cluster 模式部署时候需要注意不同实例写入不同文件
const appInstance = Number(process.env.NODE_APP_INSTANCE);

/**
 * 获取 log 路径
 * @param {String} type 日志类型
 */
function getLogPath(type: string) {
  const filename = appInstance ? `${type}.${appInstance}` : type;
  return `${config.loggerPath || "."}/logs/${filename}.log`;
}

function getPino(opt: pino.LoggerOptions, type: string) {
  const stream = config.ispro ? getStream(getLogPath(type)) : process.stdout;
  return pino(opt, stream);
}

const prettyPrint = config.ispro
  ? false
  : ({ timeTransOnly: true, forceColor: true, translateTime: "SYS:HH:MM:ss.l" } as any);

function _getLogger(name: string, level = defaultLevel) {
  const opt = {
    level,
    base: null,
    prettyPrint,
    serializers: {
      err: pino.stdSerializers.err,
    } as Record<string, any>,
  };
  if (name === "web") {
    opt.serializers = {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    };
  }
  return getPino(opt, name);
}

export const systemLogger = _getLogger("system") as ILogger;
export const webLogger = _getLogger("web") as ILogger;
export const mysqlLogger = _getLogger("mysql") as ILogger;

export function getLogger(name: string, addtion: Record<string, any> = {}): ILogger {
  return (systemLogger as pino.Logger).child({ ...addtion, name }) as ILogger;
}

export function getSqlLogger(name: string, addtion: Record<string, any> = {}): ILogger {
  return (mysqlLogger as pino.Logger).child({ ...addtion, name }) as ILogger;
}

export function webMiddle(logger: ILogger, level: pino.Level = "trace") {
  return (req: any, res: any, next?: any) => {
    const start = Date.now();
    res.on("finish", () => {
      const time = Date.now() - start;
      if (res.statusCode >= 300) level = "info";
      if (res.statusCode >= 400 || time > 1000) level = "warn";
      if (res.statusCode >= 500) level = "error";
      logger[level]("respone:", { route: req.originalUrl || req.url, code: res.statusCode, time });
    });
    if (next) {
      next();
    }
  };
}

export const logger = systemLogger;
export default systemLogger;

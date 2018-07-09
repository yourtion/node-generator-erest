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

export interface ILogger {
  trace(error: Error, ...params: any[]): void;
  trace(obj: object, ...params: any[]): void;
  trace(format: any, ...params: any[]): void;
  debug(error: Error, ...params: any[]): void;
  debug(obj: object, ...params: any[]): void;
  debug(format: any, ...params: any[]): void;
  info(error: Error, ...params: any[]): void;
  info(obj: object, ...params: any[]): void;
  info(format: any, ...params: any[]): void;
  warn(error: Error, ...params: any[]): void;
  warn(obj: object, ...params: any[]): void;
  warn(format: any, ...params: any[]): void;
  error(error: Error, ...params: any[]): void;
  error(obj: object, ...params: any[]): void;
  error(format: any, ...params: any[]): void;
  fatal(error: Error, ...params: any[]): void;
  fatal(obj: object, ...params: any[]): void;
  fatal(format: any, ...params: any[]): void;
}

const defaultLevel = config.logLevel || config.ispro ? "info" : "trace";

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

function _getLogger(name: string, level = defaultLevel) {
  const opt = {
    level,
    base: null,
    prettyPrint: !config.ispro,
    serializers: {
      err: pino.stdSerializers.err,
    } as Record<string, any>,
  };
  if (name === "express") {
    opt.serializers = {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    };
  }
  return getPino(opt, name);
}

export const systemLogger = _getLogger("system") as ILogger;
export const expressLogger = _getLogger("express") as ILogger;
export const mysqlLogger = _getLogger("mysql") as ILogger;

export function getLogger(name: string, addtion: Record<string, any> = {}): ILogger {
  return (systemLogger as pino.Logger).child({ ...addtion, name }) as ILogger;
}

export function expressMiddle(logger: ILogger, level: pino.Level = "trace") {
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

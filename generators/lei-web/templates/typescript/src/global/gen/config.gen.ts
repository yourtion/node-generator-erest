export interface IMessage {
  success: string;
  error: string;
}

export interface IRedis {
  host: string;
  port: number;
  db: number;
  keyPrefix: string;
}

export interface IMysql {
  host: string;
  user: string;
  password: string;
  database: string;
  charset: string;
  connectionLimit: number;
}

export interface IConfig {
  [key: string]: any;
  env: string;
  ispro: boolean;
  tablePrefix: string;
  /** 默认 cookies 时间 (7day) */
  cookieMaxAge: number;
  /** session 密钥 */
  sessionSecret: string;
  /** session 前缀 */
  sessionPrefix: string;
  /** 密码加盐长度 */
  saltRounds: number;
  loggerDebug: boolean;
  redisKey: string;
  message: IMessage;
  redis: IRedis;
  mysql: IMysql;
}

export interface IMessage {
  success: string;
  error: string;
}

export interface IRedis {
  host: string;
  port: number;
  db: number;
  keyPrefix: string;
  showFriendlyErrorStack: boolean;
}

export interface IMysql {
  host: string;
  user: string;
  password: string;
  database: string;
}

export interface IConfig {
  [key: string]: any;
  env: string;
  ispro: boolean;
  tablePrefix: string;
  cookieMaxAge: string;
  sessionSecret: string;
  sessionPrefix: string;
  saltRounds: number;
  loggerDebug: boolean;
  redisKey: string;
  message: IMessage;
  redis: IRedis;
  mysql: IMysql;
}

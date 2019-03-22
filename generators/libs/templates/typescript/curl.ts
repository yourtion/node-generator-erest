import { request as httpRequest, RequestOptions, Agent as httpAgent, IncomingMessage } from "http";
import { request as httpsRequest, Agent as httpsAgent } from "https";
import { URL } from "url";

export type Agent = httpsAgent | httpAgent;

export interface ICURLLogger {
  trace(...params: any[]): any;
  error(...params: any[]): any;
}

export interface ICURLOptBase {
  /** 请求的 Agent */
  agent?: Agent;
  /** 超时时间（默认5s） */
  timeout?: number;
  /** 是否对结果执行JSON.parse */
  json?: boolean;
  /** 默认请求头信息 */
  headers?: Record<string, string>;
  /** 日志记录实例 */
  logger?: ICURLLogger;
  /** 是否打开Debug模式 */
  debug?: boolean;
  /** 发生错误（请求错误/code !== 200）是否打印日志（默认true） */
  logWhenError?: boolean;
}

export interface ICURLOptHost extends ICURLOptBase {
  host: string;
  isHttps: boolean;
  port?: number;
  basePath?: string;
}

export interface ICURLOptUrl extends ICURLOptBase {
  baseUrl: string;
}

export type ICURLOpt = ICURLOptUrl | ICURLOptHost;

/** 请求结果 */
export interface IResponse {
  /** 消耗时间（ms） */
  spent: number;
  /** HTTP状态码 */
  code: number;
  /** 返回的Body */
  body: string;
  /** 返回的Res */
  res: IncomingMessage;
}

const AGENT_OPTION = { keepAlive: true };
const NOOP = (...args: any[]) => {};

export default class CURL {
  private isHttps: boolean;
  private hostname: string;
  private port: number;
  private agent: Agent;
  private basePath: string;
  private timeout: number;
  private json: boolean;
  private headers: Record<string, string>;
  private logger?: ICURLLogger;
  private debug: boolean;
  private logWhenError: boolean;
  public getReqId: () => string;

  constructor(opt: ICURLOpt) {
    const o = Object.assign({}, opt) as ICURLOptHost & ICURLOptUrl;
    if (o.baseUrl) {
      const url = new URL(o.baseUrl);
      o.isHttps = o.isHttps !== undefined ? o.isHttps : url.protocol.indexOf("https") > -1;
      o.host = o.host || url.host;
      o.port = Number(o.port);
      o.basePath = o.basePath || url.pathname;
    }
    this.isHttps = o.isHttps !== undefined ? o.isHttps : false;
    this.hostname = o.host || "";
    this.port = o.port || (this.isHttps ? 443 : 80);
    this.basePath = o.basePath || "";
    this.agent = o.agent || (this.isHttps ? new httpsAgent(AGENT_OPTION) : new httpAgent(AGENT_OPTION));
    this.timeout = o.timeout || 5000;
    this.json = o.json !== undefined ? o.json : true;
    this.headers = o.headers || (this.json ? { "Content-Type": "application/json; charset=utf8" } : {});
    this.getReqId = () => "";
    this.logger = o.logger;
    this.debug = !!o.debug;
    this.logWhenError = o.logWhenError !== undefined ? o.logWhenError : true;
    this.logTarce(this);
  }

  get logTarce() {
    return this.logger && this.debug ? this.logger.trace : NOOP;
  }

  get logError() {
    return this.logger && this.logWhenError ? this.logger.error : NOOP;
  }

  private logReqError(err: any, opt: RequestOptions, body: any) {
    this.logError(`RequestError: [${opt.method}]${opt.path}\n${JSON.stringify(opt.headers)}\n`, { err, body });
  }

  rawRequest(opt: RequestOptions, body?: any): Promise<IResponse> {
    this.logTarce("request start:", { opt, body });
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const request = this.isHttps ? httpsRequest : httpRequest;
      const req = request(opt, res => {
        const buffers: any[] = [];
        res.on("data", chunk => buffers.push(chunk));
        res.on("end", () => {
          const spent = Date.now() - startTime;
          const body = Buffer.concat(buffers).toString("utf8");
          this.logTarce("request end:", res.statusCode, body);
          return resolve({ spent, code: res.statusCode || -1, body, res });
        });
      });
      req.on("error", err => {
        this.logReqError(err, opt, body);
        reject(err);
      });
      if (body) {
        req.end(typeof body === "object" ? JSON.stringify(body) : body);
      } else {
        req.end();
      }
    });
  }

  async request(method: string, path: string, headers?: Record<string, any>, body?: any, opt?: RequestOptions) {
    this.logTarce("#>>>\n", { method, path, headers, opt });
    const options = {
      hostname: this.hostname,
      port: this.port,
      timeout: this.timeout,
      agent: this.agent,
      method,
      path: this.basePath + path,
      headers: Object.assign({ "X-Request-Id": this.getReqId() }, headers || {}, this.headers),
    } as RequestOptions;
    if (opt) Object.assign(options, opt);
    const res = await this.rawRequest(options, body);
    const response = { ok: res.code === 200, code: res.code, data: res.body, spent: res.spent };
    if (!response.ok) {
      this.logReqError(res.code, options, body);
    }
    if (response.ok && this.json) {
      response.data = JSON.parse(res.body);
    }
    return response;
  }

  public get(path: string, headers?: Record<string, any>) {
    return this.request("GET", path, headers);
  }

  public post(path: string, data: any, headers?: Record<string, any>) {
    return this.request("POST", path, headers, data);
  }

  public put(path: string, data: any, headers?: Record<string, any>) {
    return this.request("PUT", path, headers, data);
  }

  public delete(path: string, headers?: Record<string, any>) {
    return this.request("DELETE", path, headers);
  }

  public head(path: string, headers?: Record<string, any>) {
    return this.request("HEAD", path, headers);
  }
}

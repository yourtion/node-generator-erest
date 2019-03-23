import { request as httpRequest, RequestOptions, Agent as httpAgent, IncomingMessage } from "http";
import { request as httpsRequest, Agent as httpsAgent } from "https";
import { URL } from "url";

export type Agent = httpsAgent | httpAgent;

export interface ICURLOptBase {
  /** 请求的 Agent */
  agent?: Agent;
  /** 超时时间（默认5s） */
  timeout?: number;
  /** 默认请求头信息 */
  headers?: Record<string, string>;
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
  private headers: Record<string, string>;
  public getReqId: () => string;
  public beforeRequest: (opt: RequestOptions, body?: any) => { opt: RequestOptions; body?: any };
  public afterRequest: (response: IResponse, opt: RequestOptions, body?: any) => { ok: boolean; data: any };
  public onError: (err: Error, opt: RequestOptions, body?: any) => void = NOOP;

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
    this.headers = o.headers || { "Content-Type": "application/json; charset=utf8" };
    this.getReqId = () => "";
    this.beforeRequest = (opt: RequestOptions, body?: any) => {
      return { opt, body };
    };
    this.afterRequest = (response: IResponse) => {
      const ok = response.code === 200;
      return { ok, data: response.body };
    };
  }

  rawRequest(option: RequestOptions, bodyData?: any): Promise<IResponse> {
    const { opt, body } = this.beforeRequest(option, bodyData);
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const request = this.isHttps ? httpsRequest : httpRequest;
      const req = request(opt, res => {
        const buffers: any[] = [];
        res.on("data", chunk => buffers.push(chunk));
        res.on("end", () => {
          const spent = Date.now() - startTime;
          const body = Buffer.concat(buffers).toString("utf8");
          return resolve({ spent, code: res.statusCode || -1, body, res });
        });
      });
      req.on("error", err => {
        this.onError(err, opt, body);
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
    const { ok, data } = this.afterRequest(res, options, body);
    return { ok, code: res.code, data, spent: res.spent };
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

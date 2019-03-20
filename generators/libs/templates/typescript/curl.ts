import { request as httpRequest, RequestOptions, Agent as httpAgent } from "http";
import { request as httpsRequest, Agent as httpsAgent } from "https";
import { URL } from "url";

export type Agent = httpsAgent | httpAgent;

export interface ICURLOpt {
  baseUrl?: string;
  host?: string;
  port?: number;
  isHttps?: boolean;
  agent?: Agent;
  basePath?: string;
  timeout?: number;
  json?: boolean;
  headers?: Record<string, string>;
}

const AGENT_OPTION = { keepAlive: true };

export default class CURL {
  private isHttps: boolean;
  private hostname: string;
  private port: number;
  private agent: Agent;
  private basePath: string;
  private timeout: number;
  private json: boolean;
  private headers: Record<string, string>;

  constructor(opt: ICURLOpt) {
    const o = Object.assign({}, opt);
    if (o.baseUrl) {
      const url = new URL(o.baseUrl);
      o.isHttps = url.protocol.indexOf("https") > 0;
      o.host = url.host;
      o.port = Number(o.port);
      o.basePath = url.pathname;
    }
    this.isHttps = o.isHttps || false;
    this.hostname = o.host || "";
    this.port = o.port || (this.isHttps ? 443 : 80);
    this.basePath = o.basePath || "";
    this.agent = o.agent || (this.isHttps ? new httpsAgent(AGENT_OPTION) : new httpAgent(AGENT_OPTION));
    this.timeout = o.timeout || 5000;
    this.json = o.json !== undefined ? o.json : true;
    this.headers = o.headers || (this.json ? { "Content-Type": "application/json; charset=utf8" } : {});
  }

  rawRequest(opt: RequestOptions, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = this.isHttps ? httpsRequest : httpRequest;
      const req = request(opt, res => {
        const buffers: any[] = [];
        res.on("data", chunk => buffers.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(buffers).toString("utf8");
          if (res.statusCode !== 200) return reject({ code: res.statusCode, body, res });
          return resolve(body);
        });
      });
      req.on("error", err => reject(err));
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
      headers: Object.assign({}, headers || {}, this.headers),
    } as RequestOptions;
    if (opt) Object.assign(options, opt);
    const res = await this.rawRequest(options, body);
    return this.json ? JSON.parse(res) : res;
  }

  public get(path: string, headers?: Record<string, any>) {}

  public post(path: string, data: any, headers?: Record<string, any>) {}

  public put(path: string, data: any, headers?: Record<string, any>) {}

  public delete(path: string, headers?: Record<string, any>) {}

  public head(path: string, headers?: Record<string, any>) {}
}

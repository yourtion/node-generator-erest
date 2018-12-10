import { IAgent } from "erest/dist/lib/extend/test";
import ERest, { SUPPORT_METHODS, IValueResult, ISchemaCheckResult } from "erest";
import { ISchemaType } from "erest/dist/lib/params";

export default class TestAgent<T> {
  protected api: ERest;
  public agent: IAgent;
  public share: T;
  public checker: (data: any, schema: Record<string, ISchemaType>) => IValueResult | ISchemaCheckResult;

  constructor(api: ERest, share: T, agent: IAgent = api.test) {
    this.api = api;
    this.agent = agent;
    this.share = share;
    this.checker = api.responseChecker();
  }

  public newSession(): this {
    return new (this.constructor as any)(this.api, this.share, this.api.test.session());
  }

  protected request(method: SUPPORT_METHODS, path: string, input?: any, example?: string, params?: string[]) {
    const req = this.agent[method](path);
    if (input) {
      const param = Object.assign({}, input);
      if (params) {
        params.forEach(p => delete param[p]);
      }
      if (method === "get") {
        req.query(param);
      } else {
        req.input(param);
      }
    }
    if (example) req.takeExample(example);
    return req;
  }

  protected get(path: string, input?: any, example?: string, params?: string[]) {
    return this.request("get", path, input, example, params);
  }

  protected post(path: string, input?: any, example?: string, params?: string[]) {
    return this.request("post", path, input, example, params);
  }

  protected delete(path: string, input?: any, example?: string, params?: string[]) {
    return this.request("delete", path, input, example, params);
  }

  protected put(path: string, input?: any, example?: string, params?: string[]) {
    return this.request("put", path, input, example, params);
  }

  protected verifyOutput(res: any, schema?: any): any {
    if (!schema) throw new Error("no schema found");

    const { ok, value, message } = this.checker(res, schema);
    if (!ok) throw new Error(message);
    return value;
  }
}

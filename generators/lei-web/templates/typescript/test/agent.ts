import { IAgent } from "erest/dist/lib/extend/test";
import ERest, { SUPPORT_METHODS } from "erest";
import { ISchemaType } from "erest/dist/lib/params";
import assert from "assert";

export default class TestAgent<T> {
  protected api: ERest;
  private agent: IAgent;
  public share: T;

  constructor(api: ERest, share: T) {
    this.api = api;
    this.agent = api.test.session();
    this.share = share;
  }

  protected request(method: SUPPORT_METHODS, path: string, input?: any, example?: string, params?: string[]) {
    const req = this.agent[method](path);
    if (input) {
      const param = Object.assign({}, input);
      if (params) {
        params.forEach(p => delete param[p]);
      }
      req.input(param);
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

  protected verifyOutput(res: any, scheam?: Record<string, ISchemaType> | string | number): any {
    if (!scheam) throw new Error("no scheam found");
    const cheker = this.api.schemaChecker();
    if (typeof scheam === "string") {
      const ret = String(res);
      assert(ret === scheam);
      return ret;
    }
    if (typeof scheam === "number") {
      const ret = Number(res);
      assert(ret === scheam);
      return ret;
    }
    if (Array.isArray(res)) {
      return res.map(r => cheker(r, scheam));
    }
    if (res.page_data && Array.isArray(res.list)) {
      const ret = { page_data: res.page_data, list: [] as any[] };
      ret.list = (res.list as any[]).map(r => cheker(r, scheam));
      return ret;
    }
    return this.api.schemaChecker()(res, scheam);
  }
}

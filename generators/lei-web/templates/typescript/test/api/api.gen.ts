import TestAgent from "../agent";
import { IParamsGetBaseIndex, IResponseGetBaseIndex } from "../../src/global";

export interface IError {
  ok: boolean;
  error_code: number;
  message: string;
  msg: string;
}

export default class APITest<T> extends TestAgent<T> {
  /** 测试Index */
  getBaseIndexRaw(input?: IParamsGetBaseIndex, example?: string, headers?: Record<string, any>) {
    const req = this.get(`/api/base/index`, input, example, []);
    if (headers) req.headers(headers);
    return req;
  }
  /** 测试Index（成功） */
  getBaseIndexOk(
    input?: IParamsGetBaseIndex,
    example?: string,
    headers?: Record<string, any>
  ): Promise<IResponseGetBaseIndex> {
    return this.getBaseIndexRaw(input, example, headers).success();
  }
  /** 测试Index（出错） */
  getBaseIndexErr(input?: IParamsGetBaseIndex, example?: string, headers?: Record<string, any>): Promise<IError> {
    return this.getBaseIndexRaw(input, example, headers).error();
  }
  /** 测试Index (检查参数) */
  async getBaseIndexVerify(
    input?: IParamsGetBaseIndex,
    example?: string,
    headers?: Record<string, any>
  ): Promise<IResponseGetBaseIndex> {
    const ret = await this.getBaseIndexOk(input, example, headers);
    const opt = this.api.api.$apis.get("GET_/base/index")!.options;
    const schema = opt.responseSchema || opt.response;
    return this.verifyOutput(ret, schema);
  }
}

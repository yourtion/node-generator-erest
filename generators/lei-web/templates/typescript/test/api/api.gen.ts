import TestAgent from "../agent";
import { IParamsGetUtilsIndex, IResponseGetUtilsIndex } from "../../src/global";

export interface IError {
  ok: boolean;
  error_code: number;
  message: string;
  msg: string;
}

export default class APITest<T> extends TestAgent<T> {
  /** 测试Index */
  getUtilsIndexRaw(input?: IParamsGetUtilsIndex, example?: string, headers?: Record<string, any>) {
    const req = this.get(`/api/utils/index`, input, example, []);
    if (headers) req.headers(headers);
    return req;
  }
  /** 测试Index（成功） */
  getUtilsIndexOk(
    input?: IParamsGetUtilsIndex,
    example?: string,
    headers?: Record<string, any>
  ): Promise<IResponseGetUtilsIndex> {
    return this.getUtilsIndexRaw(input, example, headers).success();
  }
  /** 测试Index（出错） */
  getUtilsIndexErr(input?: IParamsGetUtilsIndex, example?: string, headers?: Record<string, any>): Promise<IError> {
    return this.getUtilsIndexRaw(input, example, headers).error();
  }
  /** 测试Index (检查参数) */
  async getUtilsIndexVerify(
    input?: IParamsGetUtilsIndex,
    example?: string,
    headers?: Record<string, any>
  ): Promise<IResponseGetUtilsIndex> {
    const ret = await this.getUtilsIndexOk(input, example, headers);
    const opt = this.api.api.$apis.get("GET_/utils/index")!.options;
    const schema = opt.responseSchema || opt.response;
    return this.verifyOutput(ret, schema);
  }
}

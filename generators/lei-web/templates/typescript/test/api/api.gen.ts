import TestAgent from "../agent";
import { IParamsGetBaseIndex } from "../../src/global";

export default class APITest<T> extends TestAgent<T> {
  /** 测试Index */
  getBaseIndexRaw(input?: IParamsGetBaseIndex, example?: string) {
    return this.get(`/api/base/index`, input, example, []);
  }
  /** 测试Index（成功） */
  getBaseIndexOk(input?: IParamsGetBaseIndex, example?: string) {
    return this.getBaseIndexRaw(input, example).success();
  }
  /** 测试Index（出错） */
  getBaseIndexErr(input?: IParamsGetBaseIndex, example?: string) {
    return this.getBaseIndexRaw(input, example).error();
  }
  /** 测试Index (检查参数) */
  async getBaseIndexVerify(input?: IParamsGetBaseIndex, example?: string) {
    const ret = await this.getBaseIndexOk(input, example);
    const schema = this.api.api.$apis.get("GET_/base/index")!.options.responseSchema;
    return this.verifyOutput(ret, schema);
  }
}

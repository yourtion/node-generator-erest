import { assert } from "chai";

import testAgent from "./init";
const { data } = testAgent.share;
const share = Object.assign({}, data.core, data.base);

describe("API - Utils", () => {
  it("TEST - index", async () => {
    const ret = await testAgent.getUtilsIndexOk(share, "Utils-Index");
    assert.equal(ret, "Hello, ERest Index");
  });
});

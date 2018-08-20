import { assert } from "chai";

import testAgent from "./init";
const { data } = testAgent.share;
const share = Object.assign({}, data.core, data.base);

describe("API - Index", () => {
  it("TEST - index", async () => {
    const ret = await testAgent.getBaseIndexOk(share, "Base-Index");
    assert.equal(ret, "Hello, API Framework Index");
  });
});

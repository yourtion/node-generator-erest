import { assert } from "chai";

import apiService from "./init";
const agent = apiService.test.session();
const shareData = apiService.shareTestData.data;

const share = Object.assign({}, shareData.core, shareData.index);

describe("API - Index", () => {
  it("TEST - index", async () => {
    const ret = await agent
      .get("/api/base/index")
      .input(share)
      .takeExample("Base-Index")
      .success();
    assert.equal(ret, "Hello, API Framework Index");
  });
});

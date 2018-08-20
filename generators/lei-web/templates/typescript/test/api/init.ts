import Debug from "debug";
import fs from "fs";
import yaml from "js-yaml";
import { merge } from "lodash";
import path from "path";
import util from "util";

import apiService from "../../src/api";
import app from "../../src/app";
import { Context } from "../../src/web";
import { Model, Service } from "../../src/global/index";
import prettier from "prettier";
import APITest from "./api.gen";

const debug = Debug("erest:test");

const testData = {};

try {
  const dataFile = process.env.TEST_DATA || path.resolve(__dirname, "./data.yaml");
  const conf = yaml.safeLoad(fs.readFileSync(dataFile).toString());
  merge(testData, conf);
} catch (err) {
  // tslint:disable-next-line no-console
  console.log(err);
}

apiService.initTest(app.server, __dirname);

function format(data: any): [Error | null, any] {
  debug(util.inspect(data, false, 5, true));
  if (data.ok && data.result) {
    return [null, data.result];
  }
  return [data.msg || data.message, null];
}

apiService.setFormatOutput(format);

function prettierSaveFile(filepath: string, content: string) {
  const str = prettier.format(content, { filepath });
  return fs.writeFileSync(filepath, str, "utf8");
}

apiService.setDocWritter(prettierSaveFile);

class MockContext extends Context {
  public test = true;
  get request() {
    return { path: undefined, $params: {} } as any;
  }
}

const ctx = new MockContext();

const shareTestData = {
  data: testData as any,
  model: new Model(ctx),
  service: new Service(ctx),
};

const testAgent = new APITest(apiService, shareTestData);

export default testAgent;

import Debug from "debug";
import fs from "fs";
import yaml from "js-yaml";
import { merge } from "lodash";
import path from "path";
import util from "util";

import apiService from "../../src/api";
import app from "../../src/app";

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

apiService.initTest(app, __dirname);

function format(data: any): [Error | null, any] {
  debug(util.inspect(data, false, 5, true));
  if (data.success && data.result) {
    return [null, data.result];
  }
  return [data.msg || data.message, null];
}

apiService.setFormatOutput(format);

apiService.shareTestData = {
  data: testData,
};

export default apiService;

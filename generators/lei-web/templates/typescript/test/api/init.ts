import Debug from "debug";
import fs from "fs";
import yaml from "js-yaml";
import { merge } from "lodash";
import path from "path";
import util from "util";

import app from "../../src/app";
import apiService from "../../src/api";
import { utils } from "../../src/global";
import prettier from "prettier";
import APITest from "./api.gen";

const debug = Debug("erest:test");

const testData = {};

try {
  const dataFile = process.env.TEST_DATA || path.resolve(__dirname, "./data.yaml");
  const conf = yaml.load(fs.readFileSync(dataFile).toString());
  merge(testData, conf);
} catch (err) {
  // tslint:disable-next-line no-console
  console.log(err);
}

apiService.initTest(app.server, __dirname, path.resolve(__dirname, "../../docs"));

function format(data: any): [Error | null, any] {
  debug(util.inspect(data, false, 5, true));
  if (data.ok && data.result) {
    return [null, data.result];
  }
  return [data, null];
}

apiService.setFormatOutput(format);

function prettierSaveFile(filepath: string, content: string) {
  const str = prettier.format(content, { filepath });
  return fs.writeFileSync(filepath, str, "utf8");
}

apiService.setDocWritter(prettierSaveFile);

const shareTestData = {
  data: testData as any,
  model: app.model,
  service: app.service,
  config: app.config,
  sleep: utils.sleep,
};

const testAgent = new APITest(apiService, shareTestData);

export default testAgent;

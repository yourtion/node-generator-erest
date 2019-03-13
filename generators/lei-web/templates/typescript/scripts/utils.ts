import Debug from "debug";

import * as u from "../src/global/base/utils";

export const utils = u;

const debug = Debug("erest:utils:");

import prettier from "prettier";
export let prettierConfig = {};
try {
  prettierConfig = require("../.prettierrc");
} catch (error) {
  debug("prettierConfig empty");
}
if (Object.keys(prettierConfig).length === 0) {
  const packageInfo = require("../package.json");
  prettierConfig = packageInfo.prettier || {};
}

export async function prettierSaveFile(filepath: string, content: string, overwrite = false) {
  if (!overwrite) {
    const exists = await u.existsAsync(filepath);
    if (exists) {
      debug("file exists: %s", filepath);
      return Promise.resolve();
    }
  }
  const str = prettier.format(content, { ...prettierConfig, filepath });
  return utils.writeFileAsync(filepath, str, "utf8");
}

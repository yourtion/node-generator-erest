/**
 * @file API文件
 */

import API from "erest";
const pjson = require("../package.json");

import { InternalError, InvalidParameter, MissingParameter } from "./global/gen/errors.gen";

import { Context } from "./web";

const description = `
${(pjson as any).name}系统API文档
`;

const INFO = {
  title: (pjson as any).name || "",
  description,
  version: new Date(),
  host: "http://127.0.0.1:3001",
  basePath: "/api",
};

const GROUPS = {
  Utils: "工具",
};

export type HANDLER = (ctx: Context, err?: any) => void;

const apiService = new API<HANDLER>({
  info: INFO,
  groups: GROUPS,
  forceGroup: true,
  path: require("path").resolve(__dirname, "routers"),
  missingParameterError: (msg: string) => new MissingParameter(msg),
  invalidParameterError: (msg: string) => new InvalidParameter(msg),
  internalError: (msg: string) => new InternalError(msg),
  docs: {
    wiki: "./",
    home: true,
  },
});

export default apiService;

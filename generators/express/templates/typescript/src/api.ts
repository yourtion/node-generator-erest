/**
 * @file API文件
 */

import API from "erest";
const pjson = require("../package.json");

import { IPageParams, ILogger } from "./global";
import { InternalError, InvalidParameter, MissingParameter } from "./global/gen/errors.gen";
import { IPageResult } from "./models/base";

import { Request, Response, NextFunction } from "express";

export interface IResponse extends Response {
  success: (data: any) => void;
  error: (error: any, code?: number) => void;
  page: (data: IPageResult<any>) => void;
  file: (filename: string, filetype: string, buffer: Buffer) => any;
}

export interface IRequest extends Request {
  $params: Record<string, any>;
  $pages: IPageParams;
  $ip: string;
  $log: ILogger;
}

const INFO = {
  title: (pjson as any).name || "",
  description: (pjson as any).name + "系统API文档",
  version: new Date(),
  host: "http://127.0.0.1:3001",
  basePath: "/api",
};

const GROUPS = {
  Base: "基础",
};

export type HANDLER = (req: IRequest, res: IResponse, next?: NextFunction) => void;

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

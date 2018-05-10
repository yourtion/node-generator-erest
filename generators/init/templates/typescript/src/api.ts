/**
 * @file API文件
 * @author <%= author %>
 */

import API from "erest";
import * as pjson from "../package.json";

import { IKVObject, IPageParams } from "./global";
import { InternalError, InvalidParameter, MissingParameter } from "./global/gen/errors.gen";
import { IPageResult } from "./models/base";

import { Request, Response } from "express";

export interface IResponse extends Response {
  success: (data: any) => void;
  error: (error: any, code?: number) => void;
  page: (data: IPageResult<any>) => void;
  file: (filename: string, filetype: string, buffer: Buffer) => any;
}

export interface IRequest extends Request {
  $params: IKVObject;
  $pages: IPageParams;
  $ip: string;
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

const apiService = new API<IRequest, IResponse>({
  info: INFO,
  groups: GROUPS,
  path: require("path").resolve(__dirname, "routers"),
  missingParameterError: (msg: string) => new MissingParameter(msg),
  invalidParameterError: (msg: string) => new InvalidParameter(msg),
  internalError: (msg: string) => new InternalError(msg),
});

export default apiService;

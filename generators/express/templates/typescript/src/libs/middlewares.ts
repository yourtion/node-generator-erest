/**
 * @file 中间件
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import { NextFunction, Request, RequestHandler, Response } from "express";
import { IRequest, IResponse } from "../api";
import { logger, utils } from "../global";

function toHandler(customHandle: (req: IRequest, res: IResponse, next: NextFunction) => void) {
  return customHandle as RequestHandler;
}

export function cros(req: Request, res: Response, next: NextFunction) {
  res.header("Access-Control-Allow-Origin", req.headers.origin as string);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Content-Length, Authorization, Accept, X-Requested-With , Cookie"
  );
  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS, PATCH");
  next();
}

export function parsePages(req: IRequest, res: IResponse, next: NextFunction) {
  const param = req.$params || req.query;
  const page = (param.page && Number(param.page)) || 1;
  const pageCount = (param.page_count && Number(param.page_count)) || 30;
  const order = param.order;
  const asc = param.asc;
  req.$pages = {
    page,
    limit: pageCount,
    offset: (page - 1) * pageCount,
    order,
    asc,
  };
  logger.trace("parsePages: ", req.$pages);
  next();
}

export const parseIp = toHandler((req: IRequest, res: IResponse, next: NextFunction) => {
  req.$ip = utils.getClientIP(req);
  next();
});

/**
 * @file 中间件
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import { Context } from "../web";
import { logger, errors } from "../global";

export function parsePages(ctx: Context) {
  const param = ctx.request.$params || ctx.request.query;
  const page = (param.page && Number(param.page)) || 1;
  const pageCount = (param.page_count && Number(param.page_count)) || 30;
  const limit = param.limit || pageCount;
  const offset = param.offset || (page - 1) * pageCount;
  const order = param.order;
  const asc = param.asc;
  ctx.request.$pages = { page, limit, offset , order, asc };
  logger.trace("parsePages: ", ctx.request.$pages);
  ctx.next();
}

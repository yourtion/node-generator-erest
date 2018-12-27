/**
 * @file jwt 中间件
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import jsonwebtoken from "jsonwebtoken";
import { Context, component } from "../web";

export const cookie = component.cookieParser();

function parseLoginTokenRaw(ctx: Context) {
  const token = ctx.request.cookies.login_token;
  if (token) {
    const ret = jsonwebtoken.verify(token, ctx.config.sessionSecret);
    if (typeof ret !== "string") {
      ctx.user = ret as any;
    }
  }
  ctx.next();
}

function ensureLoginRaw(ctx: Context) {
  if (ctx.user && ctx.user.id > 0 && ctx.user.openid) {
    return ctx.next();
  }
  throw new ctx.errors.PermissionsError("not login");
}

/** 当有可能登录也有可能未登录的情况使用 */
export const parseLoginToken = [cookie, parseLoginTokenRaw];

/** 强制一定要登录的情况使用 */
export const ensureLogin = [...parseLoginToken, ensureLoginRaw];

/** 签发Token */
export function signToken(ctx: Context, id: number, openid: string) {
  const token = jsonwebtoken.sign({ id, openid }, ctx.config.sessionSecret);
  ctx.response.cookie("login_token", token, { path: "/", maxAge: ctx.config.cookieMaxAge });
  return token;
}

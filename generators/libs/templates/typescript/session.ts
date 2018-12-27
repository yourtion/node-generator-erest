/**
 * @file session 中间件
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import { Context, component } from "../web";
import { newRedis, config, errors } from "../global";
import { MiddlewareHandle } from "@leizm/web";

const redisSession = component.session({
  store: new component.SessiionRedisStore({
    client: newRedis() as any,
    prefix: config.redisKey,
  }),
  maxAge: config.cookieMaxAge,
});
const cookie = component.cookieParser(config.sessionSecret);

export function session(...ext: MiddlewareHandle<Context>[]) {
  return [cookie, redisSession, ...ext];
}

function adminCheck(ctx: Context) {
  if (!ctx.session.data.admin) throw new errors.PermissionsError("管理员未登录");
  ctx.next();
}

/** 管理员登录状态 */
export function admin() {
  return session(adminCheck);
}

function userCheck(ctx: Context) {
  if (!ctx.session.data.user) throw new errors.PermissionsError("用户未登录");
  ctx.next();
}

/** 用户登录状态 */
export function user() {
  return session(userCheck);
}

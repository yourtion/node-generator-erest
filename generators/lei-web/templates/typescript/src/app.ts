/**
 * @file app 入口文件
 */

import { component, Connect, Router } from "./web";
import { resolve } from "path";

const app = new Connect();
const router = new Router();

import apiService from "./api";
import { config, errors, logger } from "./global";

// 静态文件
app.use("/h5", component.serveStatic(resolve(__dirname, "../public/h5")));
app.use("/admin", component.serveStatic(resolve(__dirname, "../public/admin")));
app.use("/api", router);

// 获取IP
router.use("/", ctx => {
  if (ctx.request.headers.origin) {
    ctx.response.setHeader("Access-Control-Allow-Origin", String(ctx.request.headers.origin));
    ctx.response.setHeader("Access-Control-Allow-Credentials", "true");
    ctx.response.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Content-Length, Authorization, Accept, X-Requested-With , Cookie"
    );
    ctx.response.setHeader("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS, PATCH");
  }
  if (ctx.request.method && ctx.request.method.toUpperCase() === "OPTIONS") {
    ctx.response.setStatus(200);
    ctx.response.end();
  } else {
    ctx.next();
  }
});

router.use("/", component.bodyParser.json());
router.use("/", component.bodyParser.urlencoded({ extended: true }));

require("./routers");
apiService.bindRouterToApp(router, Router, apiService.checkerLeiWeb);

router.use("/", (ctx, err: any) => {
  if (config.ispro && !err.show) {
    const path = ctx.request.path || ctx.request.url;
    logger.error(path, "params", ctx.request.$params);
    ctx.response.error(new errors.InternalError(err.code));
  } else {
    ctx.response.error(err);
  }
  if (err.log || err.log === undefined) {
    logger.error(err);
  }
  ctx.next();
});

export default app;

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
router.use("/", component.cors());
router.use("/", component.bodyParser.json());
router.use("/", component.bodyParser.urlencoded({ extended: true }));

require("./routers");
apiService.bindRouterToApp(router, Router, apiService.checkerLeiWeb);

router.use("/", (ctx, err: any) => {
  if (config.ispro && !err.show) {
    // const path = req.route && req.route.path || req.url;
    // logger.error(path, "params", req.$params);
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

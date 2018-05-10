/**
 * @file app 入口文件
 */

import expressRaw, {Express, NextFunction} from "express";
import expressCoroutine from "express-coroutine";
const express = expressCoroutine(expressRaw);

const app: Express = express();
const router = express.Router();

import { config, errors, getLogger } from "./global";
import { middlewares } from "./libs";
const logger = getLogger("app");

import apiService, {IRequest, IResponse} from "./api";

// 静态文件
app.use(express.static("public"));

app.use("/api", router);
// 路由处理
// Session
// router.use(middlewares.session());
// 获取IP
router.use(middlewares.parseIp);

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

(router as any).use((req: IRequest, res: IResponse, next: NextFunction) => {
  res.error = (err, code) => {
    res.json({
      success: false,
      error_code: code || err.code || -1,
      message: err.message || err.toString(),
      msg: err.msg || err.message || err.toString(),
    });
  };
  res.success = data => {
    res.json({
      success: true,
      result: data || {},
    });
  };
  res.page = data => {
    res.success({
      page_data: {
        page: req.$pages.page,
        page_count: req.$pages.limit,
        count: data.count || 0,
      },
      list: data.list || [],
    });
  };
  res.file = (filename, filetype, buffer) => {
    res.type(filetype);
    res.setHeader("Content-Description", "File Transfer");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.${filetype}`);
    res.setHeader("Content-Length", String(buffer.length));
    res.end(buffer);
  };
  next();
});

require("./routers");
apiService.bindRouter(router);

(router as any).use((err: any, req: IRequest, res: IResponse, next: NextFunction) => {
  if (config.ispro && !err.show) {
    const path = req.route && req.route.path || req.url;
    logger.error(path, "params", req.$params);
    res.error(new errors.InternalError(err.code));
  } else {
    res.error(err);
  }
  if (err.log || err.log === undefined) {
    logger.error(err);
  }
  next();
});

export default app;

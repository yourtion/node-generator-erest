/**
 * @file 路由加载文件
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import fs from "fs";
import path from "path";
import { logger } from "../global";

const dirPath = path.resolve(__dirname, "./");
const list = fs.readdirSync(dirPath);
for (const file of list) {
  if (file !== "index.ts" && file.indexOf(".ts") !== -1) {
    logger.debug("Load: %s", file);
    require("./" + file);
  }
}

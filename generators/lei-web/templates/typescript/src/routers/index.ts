/**
 * @file 路由加载文件
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import fs from "fs";
import path from "path";
import { getLogger } from "../global";
const logger = getLogger("router");

const dirPath = path.resolve(__dirname, "./");
const list = fs.readdirSync(dirPath);
for (const file of list) {
  const ext = path.extname(file);
  if (file.indexOf("index") !== 0 && [".ts", ".js"].indexOf(ext) !== -1) {
    logger.debug("Load: %s", file);
    require("./" + file);
  }
}

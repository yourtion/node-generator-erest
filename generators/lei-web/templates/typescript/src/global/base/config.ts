/**
 * @file config
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import fs from "fs";
import yaml from "js-yaml";
import { merge } from "lodash";
import path from "path";

import { IConfig } from "../gen/config.gen";
import { deepFreeze } from "./utils";

export const env = process.env.NODE_ENV || "dev";

export const config = {} as IConfig;

config.env = env;
config.ispro = env === "production";

function getConfigPath(filename: string) {
  return path.resolve(__dirname, "../../../config", `${filename}.yaml`);
}

function getConfigStringSync(filename: string) {
  return fs.readFileSync(getConfigPath(filename)).toString();
}

function loadConfigFileSync(filename: string) {
  const conf = yaml.load(getConfigStringSync(filename));
  merge(config, conf);
}

loadConfigFileSync("base");
loadConfigFileSync(env);

// 如果通过PM2启动，则有NODE_APP_INSTANCE环境变量
// 如果配置文件config/$env.$NODE_APP_INSTANCE.yaml存在，则同时加载它
const appInstance = process.env.NODE_APP_INSTANCE;
if (appInstance) {
  const name = `${env}.${appInstance}`;
  const file2 = getConfigPath(name);
  if (fs.existsSync(file2)) {
    console.log("当前服务进程通过PM2启动[序号#%s]，加载额外配置文件：%s", appInstance, file2);
    loadConfigFileSync(name);
  }
}

// 深度冻结配置
deepFreeze(config);

export default config;

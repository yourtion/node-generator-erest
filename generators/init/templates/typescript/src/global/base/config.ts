/**
 * @file config
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import fs from "fs";
import yaml from "js-yaml";
import { merge } from "lodash";
import path from "path";

import { IConfig } from "../gen/config.gen";

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
  const conf = yaml.safeLoad(getConfigStringSync(filename));
  merge(config, conf);
}

loadConfigFileSync("base");
loadConfigFileSync(env);

// 如果通过PM2启动，则有NODE_APP_INSTANCE环境变量
// 如果配置文件config/$env.$NODE_APP_INSTANCE.yaml存在，则同时加载它
const appInstance = process.env.NODE_APP_INSTANCE;
if (appInstance) {
  const file2 = getConfigPath(`${env}.${appInstance}`);
  if (fs.existsSync(file2)) {
    // tslint:disable-next-line no-console
    console.trace("当前服务进程通过PM2启动[序号#%s]，加载额外配置文件：%s", appInstance, file2);
    loadConfigFileSync(file2);
  }
}

export default config;

/**
 * @file Redis 初始化
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import Redis from "ioredis";
import { config } from "./base";
import { getLogger } from "./logger";

const logger = getLogger("redis");

export const redis = config.redis && new Redis(config.redis);

export function newRedis(conf = config.redis) {
  return new Redis(conf);
}

if (redis) {
  redis.on("error", err => logger.error(err));

  redis.on("connect", () => {
    logger.debug("Redis connected");
  });
}

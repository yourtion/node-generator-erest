/**
 * @file Redis 初始化
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import Redis from "ioredis";
import { config } from "./base";
import { getLogger } from "./logger";

const logger = getLogger("redis");

(Redis as any).Promise.onPossiblyUnhandledRejection((error: Error) => {
  logger.error(error);
});

export const redis = new Redis(config.redis);

redis.on("error", (err) => logger.error(err));

redis.on("connect", () => {
  logger.debug("Redis connected");
});

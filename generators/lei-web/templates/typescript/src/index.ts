/**
 * @file 入口文件
 * @author Yourtion Guo <yourtion@gmail.com>
 */

import app from "./app";
import { config, mysql, redis } from "./global";
const pjson = require("../package.json");
const projectName = pjson.name;

const PORT = config.port || process.env.PORT || 3001;
const HOST = config.host || process.env.HOST || "127.0.0.1";
app.listen({ port: Number(PORT), host: HOST }, () => {
  console.log(`${projectName} is listening on http://${HOST}:${PORT}`);
  if (process.send) {
    process.send("ready");
  }
});

process.on("uncaughtException", err => {
  console.error("uncaughtException", err);
  if (!config.noExitWhenException) process.exit(-1);
});

process.on("unhandledRejection", err => {
  console.error("unhandledRejection", err);
  if (!config.noExitWhenException) process.exit(-1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  // Clean up other resources like DB connections
  function cleanUp(cb?: any) {
    redis && redis.disconnect();
    if (mysql) {
      mysql.end(cb);
    } else {
      cb();
    }
  }

  app.server.close(() => {
    cleanUp(() => {
      process.exit();
    });
  });

  // Force close server after 5secs
  setTimeout(e => {
    console.error("Forcing server close !!!", e);
    cleanUp();
    process.exit(1);
  }, 5000);
});

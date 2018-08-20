/**
 * @file
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import mysqlLib from "mysql";
import { Pool, PoolConnection, QueryOptions } from "mysql";
import { promisify } from "util";
import { config } from "./base";
import { getLogger } from "./logger";
const logger = getLogger("mysql");

function pfy(input: any, keys: string[]) {
  keys.forEach(key => {
    if (input[key] && typeof input[key] === "function") {
      input[key + "Async"] = promisify(input[key]);
    }
  });
}

pfy(require("mysql/lib/Connection").prototype, ["query", "beginTransaction", "commit", "rollback"]);
pfy(require("mysql/lib/Pool").prototype, ["query", "getConnection", "releaseConnection", "end", "release"]);

export interface IQueryPromise {
  (options: string | QueryOptions): Promise<any>;
  (options: string, values: any): Promise<any>;
}

export interface IConnectionPromise extends PoolConnection {
  queryAsync: IQueryPromise;
  debug?: (sql: any, ...info: any[]) => any;
  beginTransactionAsync(options?: QueryOptions): Promise<void>;
  commitAsync(options?: QueryOptions): Promise<void>;
  rollbackAsync(options?: QueryOptions): Promise<void>;
}

export interface IPoolPromise extends Pool {
  queryAsync: IQueryPromise;
  getConnectionAsync(): Promise<IConnectionPromise>;
  releaseConnectionAsync(connection: IConnectionPromise): void;
  endAsync(options?: QueryOptions): Promise<void>;
  releaseAsync(options?: QueryOptions): Promise<void>;
}

export const mysql = config.mysql && (mysqlLib.createPool(config.mysql) as IPoolPromise);

if (mysql) {
  mysql
    .getConnectionAsync()
    .then((connection: IConnectionPromise) => {
      logger.debug("MySQL connected");
      return connection.release();
    })
    .catch((err: any) => {
      if (err.code === "ETIMEDOUT") {
        logger.error("ETIMEDOUT");
      } else {
        logger.error(err);
      }
    });
}

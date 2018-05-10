/**
 * @file
 * @author Yourtion Guo <yourtion@gmail.com>
 */

/* tslint:disable:unified-signatures */

import Bluebird from "bluebird";
import mysqlLib from "mysql";
import { Pool, PoolConnection, QueryOptions } from "mysql";
import { config } from "./base";
import { mysqlLogger } from "./logger";

Bluebird.promisifyAll(require("mysql/lib/Connection").prototype);
Bluebird.promisifyAll(require("mysql/lib/Pool").prototype);

export interface IQueryPromise {
  (options: string | QueryOptions): Promise<any>;
  (options: string, values: any): Promise<any>;
}

export interface IConnectionPromise extends PoolConnection {
  queryAsync: IQueryPromise;
  debug?: (sql: any) => any;
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

export const mysql = mysqlLib.createPool(config.mysql) as IPoolPromise;

mysql
  .getConnectionAsync()
  .then((connection: IConnectionPromise) => {
    mysqlLogger.debug("MySQL connected");
    return connection.release();
  })
  .catch((err: any) => {
    if (err.code === "ETIMEDOUT") {
      mysqlLogger.error("ETIMEDOUT");
    } else {
      mysqlLogger.error(err);
    }
  });

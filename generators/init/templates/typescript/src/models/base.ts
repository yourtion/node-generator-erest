/**
 * @file base model 基础模块
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import { Delete, Insert, MysqlInsert, QueryBuilder, Select, Update } from "squel";
import { config, errors, IConnectionPromise, mysql, mysqlLogger, squel, utils } from "../global";
import { IKVObject, IPageParams, IPoolPromise } from "../global";

export { Delete, Insert, MysqlInsert, Select, Update, IPoolPromise };

const SELETE_OPT = { autoQuoteTableNames: true, autoQuoteFieldNames: true };

export interface IPageResult<T> {
  count: number;
  list: T[];
}

export type IConditions = IKVObject<number | string | string[]>;
export type IPrimary = string | number;

export interface IJoinTable {
  table: string;
  alias: string;
  condition: string;
  fields?: string[];
}

export interface IJoinOptions {
  conditions?: IKVObject;
  fields?: string[];
  limit: number;
  offset: number;
  order?: string;
  asc?: boolean;
}

/**
 * 删除对象中的 undefined
 *
 * @param {Object} object
 * @returns {Object}
 */
function removeUndefined(object: IKVObject) {
  Object.keys(object).forEach(key => object[key] === undefined && delete object[key]);
  if (Object.keys.length === 0) {
    throw new errors.DatabaseError("Object is empty");
  }
  return object;
}

/**
 * 解析 Where
 *
 * @param {Object} sql Squel 对象
 * @param {Object} conditions 查询条件
 */
function _parseWhere(sql: Select, conditions: IKVObject, alias?: string) {
  Object.keys(conditions).forEach(k => {
    if (k.indexOf("$") === 0) {
      // 以 $ 开头直接解析
      if (Array.isArray(conditions[k])) {
        sql.where(conditions[k][0], ...conditions[k].slice(1));
      } else {
        sql.where(conditions[k]);
      }
    } else if (k.indexOf("#") !== -1) {
      sql.where(`${k.replace("#", "")} like ?`, "%" + conditions[k] + "%");
    } else if (k.indexOf("$") !== -1) {
      sql.where(k.replace("$", ""), conditions[k]);
    } else if (Array.isArray(conditions[k])) {
      // 数组类型使用 in 方式
      sql.where(`${alias ? alias + "." : ""}${k} in ?`, conditions[k]);
    } else {
      // 使用查询条件解析
      sql.where(`${alias ? alias + "." : ""}${k} = ?`, conditions[k]);
    }
  });
}

/**
 * 数据库错误处理
 *
 * @param {Error} err 错误
 */
function errorHandler(err: any) {
  // 如果是自定义错误直接抛出
  if (err.code && !isNaN(err.code - 0)) {
    throw err;
  }
  // 获取源文件堆栈信息
  const source = utils.getErrorSourceFromCo(err);
  // 判断条件
  switch (err.code) {
    case "ER_DUP_ENTRY":
      mysqlLogger.warn(err.sqlMessage);
      throw new errors.RepeatError();
    default:
      if (err.sql) {
        mysqlLogger.error({
          code: err.code,
          message: err.sqlMessage,
          sql: err.sql,
          source,
        });
      } else {
        mysqlLogger.error(err);
      }
      throw new errors.DatabaseError(err.sqlMessage || err);
  }
}

export interface IBaseOptions {
  prefix?: string;
  primaryKey?: string;
  fields?: string[];
  order?: string;
}

export default class Base<T> {
  public table: string;
  public primaryKey: string;
  public connect = mysql;
  public fields: string[];
  public order?: string;
  public _parseWhere = _parseWhere;

  /**
   * Creates an instance of Base.
   * @param {String} table 表名
   * @param {Object} [options={}]
   *   - {Object} fields 默认列
   *   - {Object} order 默认排序字段
   * @memberof Base
   */
  constructor(table: string, options: IBaseOptions = {}) {
    const tablePrefix = options.prefix !== undefined ? options.prefix : config.tablePrefix;
    this.table = tablePrefix ? tablePrefix + table : table;
    this.primaryKey = options.primaryKey || "id";
    this.fields = options.fields || [];
    this.order = options.order;
  }

  /**
   * 输出 SQL Debug
   *
   * @param {String} name Debug 前缀
   * @returns {String} SQL
   * @memberof Base
   */
  public debugSQL(name: string) {
    return (sql: any, ...info: any[]) => {
      mysqlLogger.debug(name, sql, ...info);
      return sql;
    };
  }

  /**
   * 查询方法（内部查询尽可能调用这个，会打印Log）
   */
  public query(sql: QueryBuilder | string, connection: IConnectionPromise | IPoolPromise = mysql) {
    const logger = (connection as IConnectionPromise).debug ? (connection as IConnectionPromise) : mysqlLogger;
    if (typeof sql === "string") {
      logger.debug!(sql);
      return connection.queryAsync(sql).catch(err => errorHandler(err));
    }
    const { text, values } = sql.toParam();
    logger.debug!(text, values);
    return connection.queryAsync(text, values).catch(err => errorHandler(err));
  }

  public _count(conditions: IConditions = {}) {
    const sql = squel
      .select()
      .from(this.table)
      .field("COUNT(*)", "c");
    _parseWhere(sql, conditions);
    return sql;
  }

  public countRaw(connect: IConnectionPromise | IPoolPromise, conditions: IConditions = {}): Promise<number> {
    return this.query(this._count(conditions), connect).then((res: any) => res && res[0] && res[0].c);
  }

  /**
   * 计算数据表 count
   */
  public count(conditions: IConditions = {}) {
    return this.countRaw(this.connect, conditions);
  }

  public _getByPrimary(primary: IPrimary, fields: string[]) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }
    const sql = squel
      .select(SELETE_OPT)
      .from(this.table)
      .where(this.primaryKey + " = ?", primary)
      .limit(1);
    fields.forEach(f => sql.field(f));
    return sql;
  }

  public getByPrimaryRaw(
    connect: IConnectionPromise | IPoolPromise,
    primary: string,
    fields = this.fields
  ): Promise<T> {
    return this.query(this._getByPrimary(primary, fields), connect).then((res: T[]) => res && res[0]);
  }

  /**
   * 根据主键获取数据
   */
  public getByPrimary(primary: string, fields = this.fields) {
    return this.getByPrimaryRaw(this.connect, primary, fields);
  }

  public _getOneByField(object: IKVObject = {}, fields = this.fields) {
    const sql = squel
      .select(SELETE_OPT)
      .from(this.table)
      .limit(1);
    fields.forEach(f => sql.field(f));
    _parseWhere(sql, object);
    return sql;
  }

  public getOneByFieldRaw(
    connect: IConnectionPromise | IPoolPromise,
    object: IKVObject = {},
    fields = this.fields
  ): Promise<T> {
    return this.query(this._getOneByField(object, fields), connect).then((res: T[]) => res && res[0]);
  }

  /**
   * 根据查询条件获取一条记录
   */
  public getOneByField(object: IKVObject = {}, fields = this.fields) {
    return this.getOneByFieldRaw(this.connect, object, fields);
  }

  public _deleteByPrimary(primary: IPrimary, limit = 1) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }
    return squel
      .delete()
      .from(this.table)
      .where(this.primaryKey + " = ?", primary)
      .limit(limit);
  }

  public deleteByPrimaryRaw(connect: IConnectionPromise | IPoolPromise, primary: IPrimary, limit = 1): Promise<number> {
    return this.query(this._deleteByPrimary(primary, limit), connect).then((res: any) => res && res.affectedRows);
  }

  /**
   * 根据主键删除数据
   */
  public deleteByPrimary(primary: IPrimary, limit = 1) {
    return this.deleteByPrimaryRaw(this.connect, primary, limit);
  }

  public _deleteByField(conditions: IConditions, limit = 1) {
    const sql = squel
      .delete()
      .from(this.table)
      .limit(limit);
    Object.keys(conditions).forEach(k =>
      sql.where(k + (Array.isArray(conditions[k]) ? " in" : " =") + " ? ", conditions[k])
    );
    return sql;
  }

  public deleteByFieldRaw(
    connect: IConnectionPromise | IPoolPromise,
    conditions: IConditions,
    limit = 1
  ): Promise<number> {
    return this.query(this._deleteByField(conditions, limit), connect).then((res: any) => res && res.affectedRows);
  }

  /**
   * 根据查询条件删除数据
   *
   * @param {Object} [object={}] 字段、值对象
   * @param {Number} [limit=1] 删除条数
   * @returns {Promise}
   * @memberof Base
   */
  public deleteByField(conditions: IConditions, limit = 1) {
    return this.deleteByFieldRaw(this.connect, conditions, limit);
  }

  /**
   * 根据查询条件获取记录
   *
   * @param {Object} [object={}] 字段、值对象
   * @param {Array} [fields=this.fields] 所需要的列数组
   * @returns {Promise}
   * @memberof Base
   */
  public getByField(conditions: IConditions = {}, fields = this.fields): Promise<T[]> {
    return this.list(conditions, fields, 999);
  }

  public _insert(object: IKVObject = {}) {
    removeUndefined(object);
    return squel
      .insert()
      .into(this.table)
      .setFields(object);
  }

  public insertRaw(connect: IConnectionPromise | IPoolPromise, object: IKVObject = {}) {
    return this.query(this._insert(object), connect);
  }

  /**
   * 插入一条数据
   */
  public insert(object: IKVObject = {}) {
    return this.insertRaw(this.connect, object);
  }

  public _batchInsert(array: IKVObject[]) {
    array.forEach(o => removeUndefined(o));
    return squel
      .insert()
      .into(this.table)
      .setFieldsRows(array);
  }

  /**
   * 批量插入数据
   */
  public batchInsert(array: IKVObject[]) {
    return this.query(this._batchInsert(array));
  }

  public _updateByField(conditions: IConditions, objects: IKVObject, raw = false) {
    if (!conditions || Object.keys(conditions).length < 1) {
      throw new Error("`key` 不能为空");
    }

    removeUndefined(objects);
    const sql = squel.update().table(this.table);
    if (!raw) {
      Object.keys(conditions).forEach(k => sql.where(`${k} = ?`, conditions[k]));
      return sql.setFields(objects);
    }
    Object.keys(conditions).forEach(k => {
      if (k.indexOf("$") === 0) {
        sql.where(conditions[k].toString());
      } else {
        sql.where(`${k} = ?`, conditions[k]);
      }
    });
    Object.keys(objects).forEach(k => {
      if (k.indexOf("$") === 0) {
        sql.set(objects[k]);
      } else {
        sql.set(`${k} = ?`, objects[k]);
      }
    });
    return sql;
  }

  public updateByFieldRaw(
    connect: IConnectionPromise | IPoolPromise,
    conditions: IConditions,
    objects: IKVObject,
    raw = false
  ): Promise<number> {
    return this.query(this._updateByField(conditions, objects, raw), connect).then(
      (res: any) => res && res.affectedRows
    );
  }

  /**
   * 根据查询条件更新记录
   */
  public updateByField(conditions: IConditions, objects: IKVObject, raw = false): Promise<number> {
    return this.updateByFieldRaw(this.connect, conditions, objects, raw);
  }

  /**
   * 根据主键更新记录
   */
  public updateByPrimary(primary: IPrimary, objects: IKVObject, raw = false): Promise<number> {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }
    const condition: IKVObject = {};
    condition[this.primaryKey] = primary;
    return this.updateByField(condition, objects, raw).then((res: any) => res && res.affectedRows);
  }

  public _createOrUpdate(objects: IKVObject, update = Object.keys(objects)) {
    removeUndefined(objects);
    const sql = squel.insert().into(this.table);
    sql.setFields(objects);
    update.forEach(k => {
      if (Array.isArray(objects[k])) {
        sql.onDupUpdate(objects[k][0], objects[k][1]);
      } else if (objects[k] !== undefined) {
        sql.onDupUpdate(k, objects[k]);
      }
    });
    return sql;
  }

  /**
   * 创建一条记录，如果存在就更新
   */
  public createOrUpdate(objects: IKVObject, update = Object.keys(objects)) {
    return this.query(this._createOrUpdate(objects, update));
  }

  public _incrFields(primary: IPrimary, fields: string[], num = 1) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }

    const sql = squel
      .update()
      .table(this.table)
      .where(this.primaryKey + " = ?", primary);
    fields.forEach(f => sql.set(`${f} = ${f} + ${num}`));
    return sql;
  }

  public incrFieldsRaw(
    connect: IConnectionPromise | IPoolPromise,
    primary: IPrimary,
    fields: string[],
    num = 1
  ): Promise<number> {
    return this.query(this._incrFields(primary, fields, num), connect).then((res: any) => res && res.affectedRows);
  }

  /**
   * 根据主键对数据列执行加一操作
   */
  public incrFields(primary: IPrimary, fields: string[], num = 1) {
    return this.incrFieldsRaw(this.connect, primary, fields, num);
  }

  public _list(
    conditions: IConditions = {},
    fields = this.fields,
    limit = 999,
    offset = 0,
    order = this.order,
    asc = true
  ) {
    removeUndefined(conditions);
    const sql = squel
      .select(SELETE_OPT)
      .from(this.table)
      .offset(offset)
      .limit(limit);
    fields.forEach(f => sql.field(f));
    _parseWhere(sql, conditions);
    if (order) {
      sql.order(order, asc);
    }
    return sql;
  }

  public listRaw(
    connect: IConnectionPromise | IPoolPromise,
    conditions = {},
    fields = this.fields,
    ...args: any[]
  ): Promise<T[]> {
    if (args.length === 2 && typeof args[1] === "object") {
      return this.query(
        this._list(conditions, fields, args[0].limit, args[0].offset, args[0].order, args[0].asc),
        connect,
      );
    }
    return this.query(this._list(conditions, fields, ...args), connect);
  }

  /**
   * 根据条件获取列表
   */
  public list(conditions: IConditions, fields?: string[], pages?: IPageParams): Promise<T[]>;
  /**
   * 根据条件获取列表
   */
  public list(
    conditions: IConditions,
    fields?: string[],
    limit?: number,
    offset?: number,
    order?: string,
    asc?: boolean,
  ): Promise<T[]>;
  public list(conditions = {}, fields = this.fields, ...args: any[]) {
    return this.listRaw(this.connect, conditions, fields, ...args);
  }

  public _search(
    keyword: string,
    search: string[],
    fields = this.fields,
    limit = 10,
    offset = 0,
    order = this.order,
    asc = true,
  ) {
    if (!keyword || search.length < 1) {
      throw new Error("`keyword` | `search` 不能为空");
    }
    const sql = squel
      .select(SELETE_OPT)
      .from(this.table)
      .offset(offset)
      .limit(limit);
    fields.forEach(f => sql.field(f));
    const exp = squel.expr();
    search.forEach(k => {
      exp.or(`${k} like ?`, "%" + keyword + "%");
    });
    sql.where(exp);
    if (order) {
      sql.order(order, asc);
    }
    return sql;
  }

  /**
   * 根据关键词进行搜索
   */
  public search(keyword: string, search: string[], fields?: string[], pages?: IPageParams): Promise<T[]>;
  /**
   * 根据关键词进行搜索
   */
  public search(
    keyword: string,
    search: string[],
    fields?: string[],
    limit?: number,
    offset?: number,
    order?: string,
    asc?: boolean,
  ): Promise<T[]>;
  public search(keyword: string, search: string[], fields = this.fields, ...args: any[]): Promise<T[]> {
    if (args.length === 1 && typeof args[0] === "object") {
      return this.query(
        this._search(keyword, search, fields, args[0].limit, args[0].offset, args[0].order, args[0].asc),
      );
    }
    return this.query(this._search(keyword, search, fields, ...args));
  }

  /**
   * 根据条件获取分页内容（比列表多出总数计算）
   */
  public page(
    conditions: IConditions,
    fields?: string[],
    limit?: number,
    offset?: number,
    order?: string,
    asc?: boolean,
  ): Promise<IPageResult<T>>;
  /**
   * 根据条件获取分页内容（比列表多出总数计算）
   */
  public page(conditions: IConditions, fields?: string[], pages?: IPageParams): Promise<IPageResult<T>>;
  public page(conditions = {}, fields = this.fields, ...args: any[]): Promise<IPageResult<T>> {
    const listSql = this.list(conditions, fields, ...args);
    const countSql = this.count(conditions);
    return Promise.all([listSql, countSql]).then(([list, count = 0]) => list && { count, list });
  }

  /**
   * 执行事务（通过传人方法）
   *
   * @param {String} name
   * @param {Function} func
   * @memberof Base
   */
  public async transactions(name: string, func: (conn: IConnectionPromise) => Promise<any>): Promise<any> {
    if (!name) {
      throw new errors.DatabaseError("`name` 不能为空");
    }
    const tid = utils.randomString(6);
    const debug = this.debugSQL(`Transactions[${tid}] - ${name}`);
    const connection = await mysql.getConnectionAsync();
    connection.debug = debug;
    await connection.beginTransactionAsync(); // 开始事务
    debug("Transaction Begin");
    try {
      const result = await func(connection);
      await connection.commitAsync(); // 提交事务
      debug(`result: ${result}`);
      debug("Transaction Done");
      return result;
    } catch (err) {
      // 回滚错误
      await connection.rollbackAsync();
      debug(`Transaction Rollback ${err.code}`);
      errorHandler(err);
    } finally {
      connection.release();
    }
  }

  /**
   * 执行事务（通过传人SQL语句数组）
   *
   * @param {Array<String>} sqls SQL语言数组
   * @returns {Promise}
   * @memberof Base
   */
  public async transactionSQLs(sqls: string[]): Promise<any> {
    if (!sqls || sqls.length < 1) {
      throw new errors.DatabaseError("`sqls` 不能为空");
    }
    mysqlLogger.debug("Begin Transaction");
    const connection = await mysql.getConnectionAsync();
    await connection.beginTransactionAsync();
    try {
      for (const sql of sqls) {
        mysqlLogger.debug(`Transaction SQL: ${sql}`);
        await connection.queryAsync(sql);
      }
      const res = await connection.commitAsync();
      mysqlLogger.debug("Done Transaction");
      return res;
    } catch (err) {
      await connection.rollbackAsync();
      mysqlLogger.debug("Rollback Transaction");
      errorHandler(err);
    } finally {
      await connection.release();
    }
  }

  /**
   * 获取统计信息通用方法
   *
   * @param {String} start 开始时间
   * @param {String} end 结束时间
   * @returns {Promise}
   * @memberof Base
   */
  public getStatistics(start: string, end: string) {
    const table = squel.select().from(this.table);
    const statusSql = table
      .clone()
      .field(`count(${this.primaryKey})`, "total")
      .field(
        table
          .clone()
          .field(`count(${this.primaryKey})`)
          .where("date(created_at) = curdate()"),
        "today",
      );
    const listSql = table
      .clone()
      .where("created_at >= ?", start + " 00:00:00")
      .where("created_at <= ?", end + " 23:59:59")
      .order("day", false)
      .field(`count(${this.primaryKey})`, "day_count")
      .field("date(created_at)", "day")
      .field(
        table
          .clone()
          .field(`count(${this.primaryKey})`)
          .where("created_at <= DATE_ADD(`day`, INTERVAL 1 DAY) "),
        "day_total",
      )
      .group("date(created_at)");
    const statusExec = this.query(statusSql);
    const listExec = this.query(listSql);
    return Promise.all([statusExec, listExec]).then(
      ([status, list]) => list && status && status[0] && { status: status[0], list },
    );
  }

  public _join(alias: string, options: IJoinOptions, ...tables: IJoinTable[]) {
    const sql = squel.select(SELETE_OPT).from(this.table, alias);
    for (const table of tables) {
      sql.left_join(table.table, table.alias, table.condition);
      if (table.fields) {
        table.fields.forEach((f: any) => sql.field(`${table.alias}.${f}`));
      }
    }
    if (options.fields) {
      options.fields.forEach((f: any) => sql.field(`${alias}.${f}`));
    }
    if (options.conditions) {
      removeUndefined(options.conditions);
      _parseWhere(sql, options.conditions, alias);
    }
    if (options.order) {
      sql.order(`${alias}.${options.order}`, options.asc);
    }
    sql.offset(options.offset).limit(options.limit);
    return sql;
  }
  public join(alias: string, options: IJoinOptions, ...tables: IJoinTable[]) {
    return this.query(this._join(alias, options, ...tables));
  }
}

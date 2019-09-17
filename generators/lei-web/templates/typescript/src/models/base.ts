/**
 * @file base model 基础模块
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import Q, { QueryBuilder, AdvancedCondition, AdvancedUpdate, RawCondition } from "@leizm/sql";
import { config, errors, IConnectionPromise, mysql, utils } from "../global";
import { IPageParams, IPoolPromise } from "../global";
import { BaseModel } from "../core";
import { Context } from "../web";

export { IPoolPromise };

export interface IPageResult<T> {
  count: number;
  list: T[];
}

export type IRecord<K> = Partial<K> | Partial<Pick<AdvancedUpdate, keyof K>>;
export type IConditions<K> = Partial<K> | Partial<Pick<AdvancedCondition, keyof K>> | RawCondition;
export type IPrimary = string | number;
export type Orders<T> = Array<[Fields<T>, boolean]>;
export interface OkPacket {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  serverStatus: number;
  warningCount: number;
  message: string;
  protocol41: true;
  changedRows: number;
}

export type Fields<T> = {
  [P in keyof T]: P extends string ? P : never;
}[keyof T];

export type Unwrap<T> = T extends Array<infer U> ? U : T extends Promise<infer U> ? U : never;

/** 联表查询 */
export interface IJoinTable {
  /** 表格 */
  table: string;
  /** 别名 */
  alias: string;
  /** 连表条件 */
  condition: string;
  /** 所需字段 */
  fields?: string[];
  /** 该表查询条件 */
  where?: IConditions<any>;
}

/** 联表查询条件 */
export interface IJoinOptions {
  /** 别名 */
  alias: string;
  /** 主表查询条件 */
  where?: IConditions<any>;
  /** 查询字段 */
  fields?: string[];
  limit: number;
  offset: number;
  order?: Fields<any> | Orders<any>;
  asc?: boolean;
}

/** 连表分页 */
export interface IJoinPageOptions {
  /** 别名 */
  alias: string;
  /** 查询条件 */
  where?: Record<string, any>;
  /** 所需字段 */
  fields?: string[];
  page: IPageParams;
}

/** 删除对象中的 undefined */
function removeUndefined(object: Record<string, any>) {
  Object.keys(object).forEach(key => object[key] === undefined && delete object[key]);
  return object;
}

/** 初始化参数 */
export interface IBaseOptions<T> {
  /** 表前缀 */
  prefix?: string;
  /** 主键 key */
  primaryKey?: string;
  /** 默认字段 */
  fields?: Array<Fields<T>>;
  /** 默认排序key */
  order?: Fields<T>;
  /** 连接 */
  connect?: IPoolPromise;
}

/**
 * @template {Object} T
 */
export default class Base<T> extends BaseModel {
  public table: string;
  public primaryKey: string;
  public connect = mysql;
  public fields: Array<Fields<T>>;
  public order?: Fields<T> | Orders<T>;

  /**
   * Creates an instance of Base.
   * @param {Context} ctx 上下文
   * @param {string} table 表名
   * @param {Object} [options={}]
   * @param {string} options.prefix - 表前缀
   * @param {string} options.primaryKey 主键 key
   * @param {Fields<T>} options.fields 默认字段
   * @param {Orders<T>} options.order 默认排序key
   */
  constructor(ctx: Context, table: string, options: IBaseOptions<T> = {}) {
    super(ctx);
    const tablePrefix = options.prefix !== undefined ? options.prefix : config.tablePrefix;
    this.table = tablePrefix ? tablePrefix + table : table;
    this.primaryKey = options.primaryKey || "id";
    this.fields = options.fields || [];
    this.order = options.order;
    if (options.connect) this.connect = options.connect;
  }

  /** 数据库错误处理 */
  errorHandler(err: any) {
    // 如果是自定义错误直接抛出
    if (err.code && !isNaN(err.code - 0)) throw err;
    // 判断条件
    switch (err.code) {
      case "ER_DUP_ENTRY":
        this.log.debug(err.sqlMessage);
        throw new errors.RepeatError();
      default:
        if (err.sql) {
          this.log.error({ code: err.code, message: err.sqlMessage, sql: err.sql });
        } else {
          this.log.error(err);
        }
        throw new errors.DatabaseError(err.sqlMessage || err);
    }
  }

  /**
   * 输出 SQL Debug
   * @param {string} name Debug 前缀
   * @returns {string} SQL
   */
  public debugSQL(name: string) {
    return (sql: QueryBuilder | string, ...info: any[]) => {
      this.log.debug(name, sql, ...info);
      return sql;
    };
  }

  /**
   * 查询方法（内部查询尽可能调用这个，会打印Log）
   * @param {QueryBuilder | string} sql 数据库查询语句
   * @param {IConnectionPromise | IPoolPromise} [connection=mysql] 数据库连接
   */
  public async query(sql: QueryBuilder | string, connection: IConnectionPromise | IPoolPromise = mysql) {
    const logger = (connection as IConnectionPromise).debug ? (connection as IConnectionPromise) : this.log;
    const s = typeof sql === "string" ? sql : sql.build();
    logger.debug!(s);
    const startTime = Date.now();
    try {
      const ret = await connection.queryAsync(s);
      return ret;
    } catch (err) {
      return this.errorHandler(err);
    } finally {
      const spent = Date.now() - startTime;
      if (config.logSlowQuery && spent > config.logSlowQuery) {
        this.log.warn("slow query: [%dms] %s", spent, s);
      }
    }
  }

  /** QueryBuilder 生成器 */
  public builder() {
    return Q.table<T>(this.table);
  }

  /** 清空表 */
  public truncateTable() {
    return this.query("TRUNCATE TABLE `" + this.table + "`;");
  }

  public _count(conditions: IConditions<T> = {}) {
    return Q.table<T>(this.table)
      .count("c")
      .where(conditions);
  }

  public countRaw(connect: IConnectionPromise | IPoolPromise, conditions: IConditions<T> = {}): Promise<number> {
    return this.query(this._count(conditions), connect).then((res: any) => res && res[0] && res[0].c);
  }

  /**
   * 计算数据表 count
   */
  public count(conditions: IConditions<T> = {}) {
    return this.countRaw(this.connect, conditions);
  }

  public _getByPrimary(primary: IPrimary, fields: Array<Fields<T>>) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }
    return Q.table<T>(this.table)
      .select(...fields)
      .where(this.primaryKey + " = ?", [primary])
      .limit(1);
  }

  public getByPrimaryRaw(
    connect: IConnectionPromise | IPoolPromise,
    primary: IPrimary,
    fields = this.fields
  ): Promise<T | undefined> {
    return this.query(this._getByPrimary(primary, fields), connect).then((res: T[]) => res && res[0]);
  }

  /**
   * 根据主键获取数据
   */
  public getByPrimary(primary: IPrimary, fields = this.fields) {
    return this.getByPrimaryRaw(this.connect, primary, fields);
  }

  public _getOneByField(conditions: IConditions<T> = {}, fields = this.fields) {
    return Q.table<T>(this.table)
      .select(...fields)
      .where(conditions)
      .limit(1);
  }

  public getOneByFieldRaw(
    connect: IConnectionPromise | IPoolPromise,
    conditions: IConditions<T> = {},
    fields = this.fields
  ): Promise<T | undefined> {
    return this.query(this._getOneByField(conditions, fields), connect).then((res: T[]) => res && res[0]);
  }

  /**
   * 根据查询条件获取一条记录
   */
  public getOneByField(conditions: IConditions<T> = {}, fields = this.fields) {
    return this.getOneByFieldRaw(this.connect, conditions, fields);
  }

  public _deleteByPrimary(primary: IPrimary, limit = 1) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }
    return Q.table<T>(this.table)
      .delete()
      .where(this.primaryKey + " = ?", [primary])
      .limit(limit);
  }

  public deleteByPrimaryRaw(connect: IConnectionPromise | IPoolPromise, primary: IPrimary, limit = 1): Promise<number> {
    return this.query(this._deleteByPrimary(primary, limit), connect).then((res: OkPacket) => res && res.affectedRows);
  }

  /**
   * 根据主键删除数据
   */
  public deleteByPrimary(primary: IPrimary, limit = 1) {
    return this.deleteByPrimaryRaw(this.connect, primary, limit);
  }

  public _deleteByField(conditions: IConditions<T>, limit = 1) {
    return Q.table<T>(this.table)
      .delete()
      .where(conditions)
      .limit(limit);
  }

  public deleteByFieldRaw(
    connect: IConnectionPromise | IPoolPromise,
    conditions: IConditions<T>,
    limit = 1
  ): Promise<number> {
    return this.query(this._deleteByField(conditions, limit), connect).then((res: OkPacket) => res && res.affectedRows);
  }

  /**
   * 根据查询条件删除数据
   *
   * @param {IConditions<T>} conditions 字段、值对象
   * @param {number} [limit=1] 删除条数
   */
  public deleteByField(conditions: IConditions<T>, limit = 1) {
    return this.deleteByFieldRaw(this.connect, conditions, limit);
  }

  /**
   * 根据查询条件获取记录
   *
   * @param {IConditions<T>} [conditions={}] 字段、值对象
   * @param {Array} [fields=this.fields] 所需要的列数组
   */
  public getByField(conditions: IConditions<T> = {}, fields = this.fields): Promise<T[]> {
    return this.list(conditions, fields, 999);
  }

  public _insert(object: Partial<T> = {}) {
    removeUndefined(object);
    return Q.table<T>(this.table).insert(object);
  }

  public insertRaw(connect: IConnectionPromise | IPoolPromise, object: Partial<T> = {}): Promise<OkPacket> {
    return this.query(this._insert(object), connect);
  }

  /**
   * 插入一条数据
   */
  public insert(object: Partial<T> = {}) {
    return this.insertRaw(this.connect, object);
  }

  public _batchInsert(array: Partial<T>[]) {
    array.forEach(o => removeUndefined(o));
    return Q.table<T>(this.table).insert(array);
  }

  public batchInsertRaw(connect: IConnectionPromise | IPoolPromise, array: Partial<T>[]) {
    return this.query(this._batchInsert(array), connect).then((res: OkPacket) => res && res.affectedRows);
  }

  /**
   * 批量插入数据
   */
  public batchInsert(array: Partial<T>[]) {
    return this.batchInsertRaw(this.connect, array);
  }

  public _updateByField(conditions: IConditions<T>, objects: IRecord<T>) {
    if (!conditions || Object.keys(conditions).length < 1) {
      throw new Error("`key` 不能为空");
    }

    removeUndefined(objects);
    return Q.table<T>(this.table)
      .update()
      .where(conditions)
      .set(objects);
  }

  public updateByFieldRaw(connect: IConnectionPromise | IPoolPromise, conditions: IConditions<T>, objects: IRecord<T>) {
    return this.query(this._updateByField(conditions, objects), connect).then(
      (res: OkPacket) => res && res.affectedRows
    );
  }

  /**
   * 根据查询条件更新记录
   */
  public updateByField(conditions: IConditions<T>, objects: IRecord<T>) {
    return this.updateByFieldRaw(this.connect, conditions, objects);
  }

  /**
   * 根据主键更新记录
   */
  public updateByPrimary(primary: IPrimary, objects: IRecord<T>) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }
    return this.updateByField({ [this.primaryKey]: primary } as any, objects);
  }

  public _createOrUpdate(objects: Partial<T> | Array<Partial<T>>, update: IRecord<T>) {
    removeUndefined(objects);
    return Q.table<T>(this.table)
      .insert(objects as any)
      .onDuplicateKeyUpdate()
      .set(update);
  }

  public createOrUpdateRaw(
    connect: IConnectionPromise | IPoolPromise,
    objects: Partial<T> | Array<Partial<T>>,
    update: IRecord<T>
  ): Promise<OkPacket> {
    return this.query(this._createOrUpdate(objects, update), connect);
  }

  /**
   * 创建一条记录，如果存在就更新
   */
  public createOrUpdate(objects: Partial<T> | Array<Partial<T>>, update: IRecord<T>) {
    return this.createOrUpdateRaw(this.connect, objects, update);
  }

  public _incrFields(primary: IPrimary | IPrimary[], ...fields: Array<[Fields<T>, number]>) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }

    const sql = Q.table<T>(this.table).update();
    if (Array.isArray(primary)) {
      sql.where({ [this.primaryKey]: { $in: primary } } as any);
    } else {
      sql.where({ [this.primaryKey]: primary } as any);
    }
    fields.forEach(f => {
      sql.set({ [f[0]]: { $incr: f[1] } } as any);
    });
    return sql;
  }

  public incrFieldsRaw(
    connect: IConnectionPromise | IPoolPromise,
    primary: IPrimary | IPrimary[],
    ...fields: Array<[Fields<T>, number]>
  ): Promise<number> {
    return this.query(this._incrFields(primary, ...fields), connect).then((res: OkPacket) => res && res.affectedRows);
  }

  /**
   * 根据主键对数据列执行加一操作
   */
  public incrFields(primary: IPrimary | IPrimary[], ...fields: Array<[Fields<T>, number]>) {
    return this.incrFieldsRaw(this.connect, primary, ...fields);
  }

  public _list(
    conditions: IConditions<T> = {},
    fields = this.fields,
    limit = 999,
    offset = 0,
    order = this.order,
    asc = true
  ) {
    removeUndefined(conditions);
    const sql = Q.table<T>(this.table)
      .select(...fields)
      .where(conditions)
      .skip(offset)
      .limit(limit);
    if (order) {
      if (order instanceof Array) {
        order.forEach(([_order, _direction = true]) => {
          sql.orderBy(`${_order} ${_direction ? "ASC" : "DESC"}`);
        });
      } else {
        sql.orderBy(`${order} ${asc ? "ASC" : "DESC"}`);
      }
    }
    return sql;
  }

  public listRaw(
    connect: IConnectionPromise | IPoolPromise,
    conditions: IConditions<T> = {},
    fields = this.fields,
    ...args: any[]
  ): Promise<T[]> {
    if (args.length === 1 && typeof args[0] === "object") {
      return this.query(
        this._list(conditions, fields, args[0].limit, args[0].offset, args[0].order, args[0].asc),
        connect
      );
    }
    return this.query(this._list(conditions, fields, ...args), connect);
  }

  /**
   * 根据条件获取列表
   */
  public list(conditions: IConditions<T>, fields?: Array<Fields<T>>, pages?: IPageParams): Promise<T[]>;
  /**
   * 根据条件获取列表
   */
  public list(
    conditions: IConditions<T>,
    fields?: Array<Fields<T>>,
    limit?: number,
    offset?: number,
    order?: Fields<T> | Orders<T>,
    asc?: boolean
  ): Promise<T[]>;
  public list(conditions = {}, fields = this.fields, ...args: any[]) {
    return this.listRaw(this.connect, conditions, fields, ...args);
  }

  /**
   * 根据条件获取分页内容（比列表多出总数计算）
   */
  public page(
    conditions: IConditions<T>,
    fields?: Array<Fields<T>>,
    limit?: number,
    offset?: number,
    order?: Fields<T>,
    asc?: boolean
  ): Promise<IPageResult<T>>;
  /**
   * 根据条件获取分页内容（比列表多出总数计算）
   */
  public page(conditions: IConditions<T>, fields?: Array<Fields<T>>, pages?: IPageParams): Promise<IPageResult<T>>;
  public page(conditions = {}, fields = this.fields, ...args: any[]): Promise<IPageResult<T>> {
    const listSql = this.list(conditions, fields, ...args);
    const countSql = this.count(conditions);
    return Promise.all([listSql, countSql]).then(([list, count = 0]) => list && { count, list });
  }

  /**
   * 执行事务（通过传人方法）
   *
   * @param {string} name
   * @param {function} func
   */
  public async transactions<TName extends string, TFunc extends (conn: IConnectionPromise) => Promise<any>>(
    name: TName,
    func: TFunc
  ): Promise<Unwrap<ReturnType<TFunc>>> {
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
      debug("result:", result);
      debug("Transaction Done");
      return result;
    } catch (err) {
      // 回滚错误
      await connection.rollbackAsync();
      debug("Transaction Rollback", err);
      this.errorHandler(err);
    } finally {
      connection.release();
    }
  }

  public _join(options: IJoinOptions, isCount: boolean, ...tables: IJoinTable[]) {
    const sql = Q.table<T>(this.table).as(options.alias);
    if (isCount) {
      sql.count("c");
    } else {
      sql.select();
    }
    for (const table of tables) {
      if (isCount) {
        sql.leftJoin(table.table);
      } else {
        sql.leftJoin(table.table, table.fields);
      }
      sql.as(table.alias).on(table.condition);
      if (table.where) {
        removeUndefined(table.where);
        sql.where(table.where);
      }
    }
    if (options.where) {
      removeUndefined(options.where);
      sql.where(options.where);
    }
    if (!isCount && options.order) {
      const { order, asc } = options;
      if (order instanceof Array) {
        order.forEach(([_order, _direction = true]) => {
          sql.orderBy(`${options.alias}.${_order}  ${_direction ? "ASC" : "DESC"}`);
        });
      } else {
        sql.orderBy(`${options.alias}.${order} ${asc ? "ASC" : "DESC"}`);
      }
    }
    if (!isCount && options.fields) sql.fields(...options.fields);
    if (!isCount && options.limit > 0) {
      sql.offset(options.offset).limit(options.limit);
    }
    return sql;
  }

  /**
   * 连表列表查询
   */
  public join(options: IJoinOptions, ...tables: IJoinTable[]) {
    return this.query(this._join(options, false, ...tables));
  }
  /**
   * 连表分页
   */
  public joinPage(options: IJoinPageOptions, ...tables: IJoinTable[]) {
    const opt = {
      alias: options.alias,
      where: options.where,
      fields: options.fields,
      limit: options.page.limit,
      offset: options.page.offset,
      order: options.page.order,
      asc: options.page.asc,
    };
    const listSql = this.query(this._join(opt, false, ...tables));
    const countSql = this.query(this._join(opt, true, ...tables)).then(res => res && res[0] && res[0].c);
    return Promise.all([listSql, countSql]).then(([list, count = 0]) => list && { count, list });
  }
}

/**
 * @file base model 基础模块
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import { Delete, Insert, MysqlInsert, QueryBuilder, Select, Update, QueryBuilderOptions } from "@blueshit/squel";
import { config, errors, IConnectionPromise, mysql, squel, utils } from "../global";
import { IPageParams, IPoolPromise } from "../global";
import { BaseModel } from "../core";
import { Context } from "../web";

export { Delete, Insert, MysqlInsert, Select, Update, IPoolPromise };

const SELETE_OPT = { autoQuoteTableNames: true, autoQuoteFieldNames: true };

export interface IPageResult<T> {
  count: number;
  list: T[];
}

export type IRecord<K> = Record<string, any> & Partial<K>;
export type IConditions<K> = Record<string, number | string | string[]> & Partial<K>;
export type IPrimary = string | number;
export type Orders = Array<[string, boolean]>;
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
  where?: Record<string, any>;
}

/** 联表查询条件 */
export interface IJoinOptions {
  /** 主表查询条件 */
  conditions?: Record<string, any>;
  /** 查询字段 */
  fields?: string[];
  limit: number;
  offset: number;
  order?: string | Orders;
  asc?: boolean;
}

/** 连表分页 */
export interface IJoinPageOptions {
  /** 查询条件 */
  conditions?: Record<string, any>;
  /** 所需字段 */
  fields?: string[];
  page: IPageParams;
}

/** 删除对象中的 undefined */
function removeUndefined(object: Record<string, any>) {
  Object.keys(object).forEach(key => object[key] === undefined && delete object[key]);
  return object;
}

/**
 * 解析 Where
 * @param {Object} sql Squel 对象
 * @param {Object} conditions 查询条件
 */
function _parseWhere(sql: Select, conditions: Record<string, any>, alias?: string) {
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

/** 初始化参数 */
export interface IBaseOptions {
  /** 表前缀 */
  prefix?: string;
  /** 主键 key */
  primaryKey?: string;
  /** 默认字段 */
  fields?: string[];
  /** 默认排序key */
  order?: string;
}

export default class Base<T> extends BaseModel {
  public table: string;
  public primaryKey: string;
  public connect = mysql;
  public fields: string[];
  public order?: string | Orders;
  public _parseWhere = _parseWhere;

  /**
   * Creates an instance of Base.
   * @param {Any} ctx 上下文
   * @param {String} tabletable 表名
   * @param {Object} [options={}]
   * @param {String} options.prefix - 表前缀
   * @param {String} options.primaryKey 主键 key
   * @param {Array} options.fields 默认字段
   * @param {String} options.order 默认排序key
   */
  constructor(ctx: Context, table: string, options: IBaseOptions = {}) {
    super(ctx);
    const tablePrefix = options.prefix !== undefined ? options.prefix : config.tablePrefix;
    this.table = tablePrefix ? tablePrefix + table : table;
    this.primaryKey = options.primaryKey || "id";
    this.fields = options.fields || [];
    this.order = options.order;
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

  /** delete 构造 */
  buildDelete(opt?: QueryBuilderOptions) {
    return squel
      .delete(opt)
      .from(this.table)
      .clone();
  }

  /** insert 构造 */
  buildInsert(opt?: QueryBuilderOptions) {
    return squel
      .insert(opt)
      .into(this.table)
      .clone();
  }

  /** select 构造 */
  buildSelect(opt?: QueryBuilderOptions) {
    return squel
      .select(opt)
      .from(this.table)
      .clone();
  }

  /** update 构造 */
  buildUpdate(opt?: QueryBuilderOptions) {
    return squel
      .update(opt)
      .table(this.table)
      .clone();
  }

  /**
   * 输出 SQL Debug
   * @param {String} name Debug 前缀
   * @returns {String} SQL
   */
  public debugSQL(name: string) {
    return (sql: QueryBuilder | string, ...info: any[]) => {
      this.log.debug(name, sql, ...info);
      return sql;
    };
  }

  /**
   * 查询方法（内部查询尽可能调用这个，会打印Log）
   * @param sql 数据库查询语句
   * @param connection 数据库连接
   */
  public query(sql: QueryBuilder | string, connection: IConnectionPromise | IPoolPromise = mysql) {
    const logger = (connection as IConnectionPromise).debug ? (connection as IConnectionPromise) : this.log;
    if (typeof sql === "string") {
      logger.debug!(sql);
      return connection.queryAsync(sql).catch(err => this.errorHandler(err));
    }
    const { text, values } = sql.toParam();
    logger.debug!(text, values);
    return connection.queryAsync(text, values).catch(err => this.errorHandler(err));
  }

  /** 清空表 */
  public truncateTable() {
    return this.query("TRUNCATE TABLE `" + this.table + "`;");
  }

  public _count(conditions: IConditions<T> = {}) {
    const sql = squel
      .select()
      .from(this.table)
      .field("COUNT(*)", "c");
    _parseWhere(sql, conditions);
    return sql;
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
    primary: IPrimary,
    fields = this.fields
  ): Promise<T> {
    return this.query(this._getByPrimary(primary, fields), connect).then((res: T[]) => res && res[0]);
  }

  /**
   * 根据主键获取数据
   */
  public getByPrimary(primary: IPrimary, fields = this.fields) {
    return this.getByPrimaryRaw(this.connect, primary, fields);
  }

  public _getOneByField(object: IRecord<T> = {}, fields = this.fields) {
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
    object: IRecord<T> = {},
    fields = this.fields
  ): Promise<T> {
    return this.query(this._getOneByField(object, fields), connect).then((res: T[]) => res && res[0]);
  }

  /**
   * 根据查询条件获取一条记录
   */
  public getOneByField(object: IRecord<T> = {}, fields = this.fields) {
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
    return this.query(this._deleteByPrimary(primary, limit), connect).then((res: OkPacket) => res && res.affectedRows);
  }

  /**
   * 根据主键删除数据
   */
  public deleteByPrimary(primary: IPrimary, limit = 1) {
    return this.deleteByPrimaryRaw(this.connect, primary, limit);
  }

  public _deleteByField(conditions: IConditions<T>, limit = 1) {
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
    conditions: IConditions<T>,
    limit = 1
  ): Promise<number> {
    return this.query(this._deleteByField(conditions, limit), connect).then((res: OkPacket) => res && res.affectedRows);
  }

  /**
   * 根据查询条件删除数据
   *
   * @param {Object} [object={}] 字段、值对象
   * @param {Number} [limit=1] 删除条数
   */
  public deleteByField(conditions: IConditions<T>, limit = 1) {
    return this.deleteByFieldRaw(this.connect, conditions, limit);
  }

  /**
   * 根据查询条件获取记录
   *
   * @param {Object} [object={}] 字段、值对象
   * @param {Array} [fields=this.fields] 所需要的列数组
   */
  public getByField(conditions: IConditions<T> = {}, fields = this.fields): Promise<T[]> {
    return this.list(conditions, fields, 999);
  }

  public _insert(object: Partial<T> = {}) {
    removeUndefined(object);
    return squel
      .insert()
      .into(this.table)
      .setFields(object);
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
    return squel
      .insert()
      .into(this.table)
      .setFieldsRows(array);
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

  public _updateByField(conditions: IConditions<T>, objects: IRecord<T>, raw = false) {
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
        if (Array.isArray(objects[k])) {
          sql.set(objects[k][0], ...objects[k].slice(1));
        } else {
          sql.set(objects[k]);
        }
      } else {
        sql.set(`${k} = ?`, objects[k]);
      }
    });
    return sql;
  }

  public updateByFieldRaw(
    connect: IConnectionPromise | IPoolPromise,
    conditions: IConditions<T>,
    objects: IRecord<T>,
    raw = false
  ) {
    return this.query(this._updateByField(conditions, objects, raw), connect).then(
      (res: OkPacket) => res && res.affectedRows
    );
  }

  /**
   * 根据查询条件更新记录
   */
  public updateByField(conditions: IConditions<T>, objects: IRecord<T>, raw = false) {
    return this.updateByFieldRaw(this.connect, conditions, objects, raw);
  }

  /**
   * 根据主键更新记录
   */
  public updateByPrimary(primary: IPrimary, objects: IRecord<T>, raw = false) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }
    const condition: IConditions<T> = {};
    condition[this.primaryKey] = primary;
    return this.updateByField(condition, objects, raw);
  }

  public _createOrUpdate(objects: IRecord<T>, update = Object.keys(objects)) {
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

  public createOrUpdateRaw(
    connect: IConnectionPromise | IPoolPromise,
    objects: IRecord<T>,
    update = Object.keys(objects)
  ): Promise<OkPacket> {
    return this.query(this._createOrUpdate(objects, update), connect);
  }

  /**
   * 创建一条记录，如果存在就更新
   */
  public createOrUpdate(objects: IRecord<T>, update = Object.keys(objects)) {
    return this.createOrUpdateRaw(this.connect, objects, update);
  }

  public _incrFields(primary: IPrimary | IPrimary[], ...fields: Array<[string, number]>) {
    if (primary === undefined) {
      throw new Error("`primary` 不能为空");
    }

    const sql = squel.update().table(this.table);
    if (Array.isArray(primary)) {
      sql.where(this.primaryKey + " in ?", primary);
    } else {
      sql.where(this.primaryKey + " = ?", primary);
    }
    fields.forEach(f => {
      sql.set(`${f[0]} = ${f[0]} + ${f[1]}`);
    });
    return sql;
  }

  public incrFieldsRaw(
    connect: IConnectionPromise | IPoolPromise,
    primary: IPrimary | IPrimary[],
    ...fields: Array<[string, number]>
  ): Promise<number> {
    return this.query(this._incrFields(primary, ...fields), connect).then((res: OkPacket) => res && res.affectedRows);
  }

  /**
   * 根据主键对数据列执行加一操作
   */
  public incrFields(primary: IPrimary | IPrimary[], ...fields: Array<[string, number]>) {
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
    const sql = squel
      .select(SELETE_OPT)
      .from(this.table)
      .offset(offset)
      .limit(limit);
    fields.forEach(f => sql.field(f));
    _parseWhere(sql, conditions);
    if (order) {
      if (order instanceof Array) {
        order.forEach(([_order, _direction = true]) => {
          sql.order(_order, _direction);
        });
      } else {
        sql.order(order as string, asc);
      }
    }
    return sql;
  }

  public listRaw(
    connect: IConnectionPromise | IPoolPromise,
    conditions = {},
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
  public list(conditions: IConditions<T>, fields?: string[], pages?: IPageParams): Promise<T[]>;
  /**
   * 根据条件获取列表
   */
  public list(
    conditions: IConditions<T>,
    fields?: string[],
    limit?: number,
    offset?: number,
    order?: string | Orders,
    asc?: boolean
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
    asc = true
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
      if (order instanceof Array) {
        order.forEach(([_order, _direction = true]) => {
          sql.order(_order, _direction);
        });
      } else {
        sql.order(order as string, !!asc);
      }
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
    asc?: boolean
  ): Promise<T[]>;
  public search(keyword: string, search: string[], fields = this.fields, ...args: any[]): Promise<T[]> {
    if (args.length === 1 && typeof args[0] === "object") {
      return this.query(
        this._search(keyword, search, fields, args[0].limit, args[0].offset, args[0].order, args[0].asc)
      );
    }
    return this.query(this._search(keyword, search, fields, ...args));
  }

  /**
   * 根据条件获取分页内容（比列表多出总数计算）
   */
  public page(
    conditions: IConditions<T>,
    fields?: string[],
    limit?: number,
    offset?: number,
    order?: string,
    asc?: boolean
  ): Promise<IPageResult<T>>;
  /**
   * 根据条件获取分页内容（比列表多出总数计算）
   */
  public page(conditions: IConditions<T>, fields?: string[], pages?: IPageParams): Promise<IPageResult<T>>;
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
      this.errorHandler(err);
    } finally {
      connection.release();
    }
  }

  public _join(alias: string, options: IJoinOptions, isCount: boolean, ...tables: IJoinTable[]) {
    const sql = squel.select().from(this.table, alias);
    for (const table of tables) {
      sql.left_join(table.table, table.alias, table.condition);
      if (!isCount && table.fields) {
        table.fields.forEach((f: any) => sql.field(`${table.alias}.${f}`));
      }
      if (table.where) {
        removeUndefined(table.where);
        _parseWhere(sql, table.where, table.alias);
      }
    }
    if (!isCount && options.fields) {
      options.fields.forEach((f: any) => sql.field(`${alias}.${f}`));
    }
    if (options.conditions) {
      removeUndefined(options.conditions);
      _parseWhere(sql, options.conditions, alias);
    }
    if (!isCount && options.order) {
      const { order, asc } = options;
      if (order instanceof Array) {
        order.forEach(([_order, _direction = true]) => {
          sql.order(`${alias}.${_order}`, _direction);
        });
      } else {
        sql.order(`${alias}.${order}`, !!asc);
      }
    }
    if (!isCount && options.limit > 0) {
      sql.offset(options.offset).limit(options.limit);
    } else if (isCount) {
      sql.field("COUNT(*)", "c");
    }
    return sql;
  }

  /**
   * 连表列表查询
   */
  public join(alias: string, options: IJoinOptions, ...tables: IJoinTable[]) {
    return this.query(this._join(alias, options, false, ...tables));
  }
  /**
   * 连表分页
   */
  public joinPage(alias: string, options: IJoinPageOptions, ...tables: IJoinTable[]) {
    const opt = {
      conditions: options.conditions,
      fields: options.fields,
      limit: options.page.limit,
      offset: options.page.offset,
      order: options.page.order,
      asc: options.page.asc,
    };
    const listSql = this.query(this._join(alias, opt, false, ...tables));
    const countSql = this.query(this._join(alias, opt, true, ...tables)).then((res: any) => res && res[0] && res[0].c);
    return Promise.all([listSql, countSql]).then(([list, count = 0]) => list && { count, list });
  }
}

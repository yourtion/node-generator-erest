import { Context } from "./web";
import { getSqlLogger } from "./global";

/**
 * 核心基类
 */
export abstract class Core {
  /** 请求上下文 */
  protected ctx: Context;
  protected test: boolean = false;
  /** 日志记录 */
  protected get log() {
    return this.ctx.getLogger({ type: this.constructor.name });
  }

  constructor(ctx: Context) {
    this.ctx = ctx;
    if ((ctx as any).test) this.test = true;
  }
}

/** 生成类 */
export type genConstructor<T> = new (ctx: Context) => T;

/** 核心生成类 */
export abstract class CoreGen<T> {
  private cache: Map<symbol, T> = new Map();
  private ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  /**
   * 新建或者获取缓存示例
   * @param key 缓存key
   * @param ins 实例类
   */
  protected getCache<V extends T>(key: symbol, ins: genConstructor<V>) {
    if (!this.cache.has(key)) {
      this.cache.set(key, new ins(this.ctx));
    }
    return this.cache.get(key) as V;
  }
}

/** 模型基类 */
export abstract class BaseModel extends Core {
  protected get log() {
    if (this.test) return getSqlLogger(this.constructor.name);
    return getSqlLogger(this.ctx.request.path, { reqId: this.ctx.$reqId, type: this.constructor.name });
  }
}

/** 路由基类 */
export abstract class BaseRouter extends Core {}

/** 控制器基类 */
export abstract class BaseController extends Core {}

/** 服务基类 */
export abstract class BaseService extends Core {}

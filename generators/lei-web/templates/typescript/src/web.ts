import * as base from "@leizm/web";
import { v4 as uuid } from "uuid";
import { IPageParams, getLogger, ILogger } from "./global";
export * from "@leizm/web";

export type MiddlewareHandle = (ctx: Context, err?: base.ErrorReason) => Promise<void> | void;

export class Connect extends base.Connect<Context> {
  protected contextConstructor = Context;
}

export class Router extends base.Router<Context> {
  protected contextConstructor = Context;
}

export class Context extends base.Context<Request, Response> {
  protected requestConstructor = Request;
  protected responseConstructor = Response;

  public $reqId = "";
  public $log = {} as ILogger;

  public inited() {
    this.$reqId = String(this.request.getHeader("X-Request-Id") || uuid());
    this.$log = getLogger(this.request.path, { reqId: this.$reqId });
    this.response.setHeader("X-Request-Id", this.$reqId);
  }
}

export class Request extends base.Request {
  // 扩展 Request
  public $params: Record<string, any> = {};
  public $pages: IPageParams = { page: 0, limit: 1, offset: 0, order: "", asc: true };
  public get $ip() {
    const ip = String(
      this.req.headers["x-real-ip"] || this.req.headers["x-forwarded-for"] || this.req.socket.remoteAddress
    ).match(/\d+\.\d+\.\d+\.\d+/);
    return (ip && ip[0]) || "";
  }
}

export class Response extends base.Response {
  // 扩展 Response
  public success(data: any) {
    this.json({ success: true, result: data || {} });
  }
  public error(err: any, code?: number) {
    this.json({
      success: false,
      error_code: code || err.code || -1,
      message: err.message || err.toString(),
      msg: err.msg || err.message || err.toString(),
    });
  }
  public page(data: any) {
    this.success({
      page_data: {
        page: (this.ctx.request as any).$pages.page,
        page_count: (this.ctx.request as any).$pages.limit,
        count: data.count || 0,
      },
      list: data.list || [],
    });
  }
  public files(filename: string, filetype: string, buffer: Buffer) {
    this.type(filetype);
    this.setHeader("Content-Description", "File Transfer");
    this.setHeader("Content-Disposition", `attachment; filename=${filename}.${filetype}`);
    this.setHeader("Content-Length", String(buffer.length));
    this.end(buffer);
  }
}

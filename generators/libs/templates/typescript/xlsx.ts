/**
 * @file Excel 解析中间件
 * @author Yourtion Guo <yourtion@gmail.com>
 */
import { Context, component } from "../web";
import { errors } from "../global";

export interface IXLSXRes {
  name: string;
  data: any[];
}

export interface xlsx {
  build(sheets: any[]): Buffer;
  parse(buffer: Buffer | string): IXLSXRes[];
}

export const xlsx = require("node-xlsx") as xlsx;

/** Excel 解析中间件 */
export function parseExcelFile() {
  function parseExcel(ctx: Context) {
    const file = ctx.request.files.file;
    if (!file) throw new errors.MissingParameter("缺少文件");
    const extName = file.originalName && file.originalName.split(".").pop();
    if (!extName || ["xls", "xlsx"].indexOf(extName) === -1) {
      throw new errors.InvalidParameter("文件类型错误");
    }
    const buffer = file.buffer;
    ctx.request.$sheet = xlsx.parse(buffer)[0].data;
    if (!ctx.request.$sheet || ctx.request.$sheet.length < 2) throw new errors.InvalidParameter("数据量不足");
    ctx.next();
  }
  return [component.bodyParser.multipart({ smallFileSize: Infinity }), parseExcel];
}

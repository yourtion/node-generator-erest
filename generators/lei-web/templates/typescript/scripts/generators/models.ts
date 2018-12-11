/**
 * @file 数据库 model 生成
 * @author Yourtion Guo <yourtion@gmail.com>
 */

/* tslint:disable: no-console */

import Debug from "debug";
import util from "util";
import { mysql, TYPES } from "../../src/global";
import { firstUpperCase, underscore2camelCase } from "../../src/global/base/utils";

const debug = Debug("erest:create_model:");

const SKIP = ["created_at", "updated_at"];

const result = {
  tableGen: ["/** \n* @file models \n* 请勿手动修改此文件内容 \n* @author Yourtion Guo <yourtion@gmail.com>\n*/\n"],
  schemas: {},
  indexs: ["/** \n* @file models export\n* @author Yourtion Guo <yourtion@gmail.com>\n*/\n"],
  modelNames: [],
  models: [],
  tables: [],
  tableImport: "",
  coreModelGen: [],
  coreModelSymbl: [],
};

function convertFiled(field: string, nullable: boolean) {
  if (field.indexOf("char") > -1) {
    return nullable ? TYPES.NullableString : TYPES.String;
  }
  if (field.indexOf("int") > -1) {
    return nullable ? TYPES.NullableInteger : TYPES.Integer;
  }
  if (field.indexOf("decimal") > -1) {
    return TYPES.Float;
  }
  if (field === "timestamp") {
    return nullable ? TYPES.NullableInteger : TYPES.Integer;
  }
  if (field.indexOf("enum") > -1) {
    return TYPES.ENUM;
  }
  if (field === "tinytext" || field === "mediumtext") {
    return nullable ? TYPES.NullableString : TYPES.String;
  }
  if (field === "text") {
    return nullable ? TYPES.NullableString : TYPES.String;
  }
  if (field === "date" || field === "datetime") {
    return TYPES.Date;
  }
  console.log(field);
  return TYPES.Any;
}

function convertInterfce(field: string, nullable: boolean, name: string) {
  if (field.indexOf("char") > -1 || field.indexOf("enum") > -1 || field === "text") {
    return `${name}${nullable ? "?" : ""}: string;`;
  }
  if (field.indexOf("int") > -1) {
    return `${name}${nullable ? "?" : ""}: number;`;
  }
  if (field === "timestamp" || field === "date") {
    return `${name}${nullable ? "?" : ""}: Date;`;
  }
  return `${name}${nullable ? "?" : ""}: any;`;
}

function enumToArray(e: string) {
  return e
    .replace("enum(", "")
    .replace(")", "")
    .replace(/'/g, "")
    .split(",");
}

function convertTable(table: any) {
  const schema: Record<string, any> = {};
  const fields: string[] = [];
  const interfaces = [];
  let key;
  for (const row of table) {
    fields.push(row.Field);
    if (row.Key === "PRI" && row.Field !== "id") {
      key = row.Field;
    }
    if (row.Comment) {
      interfaces.push(`/** ${row.Comment} */`);
    }
    interfaces.push(convertInterfce(row.Type, row.Null === "YES", row.Field));
    if (SKIP.indexOf(row.Field) > -1) {
      continue;
    }
    debug(row.Field, row.Type, row.Comment);
    schema[row.Field] = {
      type: convertFiled(row.Type, row.Null === "YES"),
      comment: row.Comment,
    };
    if (schema[row.Field].type === TYPES.ENUM) {
      schema[row.Field].params = enumToArray(row.Type);
    }
  }
  return { schema, fields, interfaces, key };
}

function tableInfo(name: string) {
  return mysql.queryAsync("show full columns from ??", [name]);
}

function tableToScheam(tableName: string) {
  return tableInfo(tableName).then(convertTable);
}

function genFile(
  tableName: string,
  tableCommet: string,
  schema: any,
  fields: Record<string, any>,
  interfaces: string[],
  key: string
) {
  const tableCamelCase = underscore2camelCase(tableName);
  const tableString = firstUpperCase(tableCamelCase);
  // 生成 Index
  result.indexs.push(`export * from "./${tableName}.m";`);

  // 生成模型
  result.modelNames.push(tableCamelCase);
  // 生成模型所需文件
  result.tableGen.push(`
    /** ${tableCommet} */
    export interface IModels${tableString} {\n  ${interfaces.join("\n  ")}\n  }
    /** ${tableCommet} Schema */
    export const ${tableCamelCase}Schema = ${util.inspect(schema, false, null)};
    /** ${tableCommet} Fields */
    export const ${tableCamelCase}Fields = ${util.inspect(fields, false, null).replace(/\n/g, "")};
    /** ${tableCommet} Table */
    export const ${tableCamelCase}Table = "${tableName}";
  `);

  let opt = `{fields: ${tableCamelCase}Fields}`;
  if (key) {
    opt = `{fields: ${tableCamelCase}Fields, primaryKey: "${key}"}`;
  }
  result.models.push(tableString + "Model");
  result.tables.push(tableCamelCase);

  // 生成 core.gen
  result.coreModelGen.push(`
  /** ${tableCommet} */
  get ${tableCamelCase}() {
    return this.getCache(${tableString.toUpperCase()}_M_SYM, ${firstUpperCase(tableString)}Model);
  }`);

  // 生成 Models 文件
  result.schemas[tableName] = `
    /**
     * @file ${tableCamelCase} Model ${tableCommet}
     * @author Yourtion Guo <yourtion@gmail.com>
     */

    import {IModels${tableString}, ${tableCamelCase}Table, ${tableCamelCase}Fields} from "../global/gen/models.gen";
    import Base from "./base";
    import { Context } from "../web";

    export class ${tableString}Model extends Base<IModels${tableString}> {
      constructor(ctx: Context ,options = {}) {
        const opt = Object.assign(${opt}, options);
        super(ctx, ${tableCamelCase}Table, opt);
      }
    }
  `;
}

export async function genTable(tbPrefix: string, tableName: string) {
  debug(tableName);
  const tableFullName = tbPrefix + tableName;
  const tables = await mysql.queryAsync("show table status where name = ?", [tableFullName]);
  const { schema, fields, interfaces, key } = await tableToScheam(tableFullName);
  const tableCommet = tables[0].Comment;
  genFile(tableName, tableCommet, schema, fields, interfaces, key);
}

export async function genModels(tbPrefix: string) {
  debug(tbPrefix);
  const tables = await mysql.queryAsync("SHOW TABLES LIKE ?", [tbPrefix + "%"]);
  const tableList = tables.map(t => t[Object.keys(t)[0]]).map(t => t.replace(tbPrefix, ""));
  for (const t of tableList) {
    await genTable(tbPrefix, t);
  }
  if (result.modelNames && result.modelNames.length > 0) {
    result.tableGen.push(`export const ModelNames = [${result.modelNames.map(m => `"${m}"`).join(", ")}]`);
    result.tableGen.push(`export type ModelName = ${result.modelNames.map(m => `"${m}Model"`).join(" | ")}`);
  }
  if (result.tableGen.length === 1) result.tableGen.push("export default {};");
  result.tableImport = `import { ${result.models.join(", ")} } from "../../models";`;
  for (const t of result.tables) {
    result.coreModelSymbl.push(`const ${t.toUpperCase()}_M_SYM = Symbol("${t.toUpperCase()}");`);
  }
  if (result.indexs.length === 1) result.indexs.push("export default {};");
  return result;
}

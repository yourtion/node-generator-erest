import apiService from "../../src/api";
import { ISchemaType } from "erest/dist/lib/params";
import { firstUpperCase, underscore2camelCase } from "../../src/global/base/utils";

const SCHEMAS = new Set();

function schemaToInterface(name: string, schema: ISchemaType) {
  const required = schema.required;
  const res = [];
  if (schema.comment) {
    res.push(`/** ${schema.comment} */`);
  }
  const type = schema.type;

  if (apiService.type.has(type)) {
    const type = apiService.type.get(schema.type);
    let teType = type.info.tsType || "any";
    res.push(`${name}${required ? "" : "?"}:${teType};`);
  } else {
    const t = type.replace("[]", "");
    if (apiService.schema.has(t)) {
      const s = "ISchema" + t;
      SCHEMAS.add(s);
      res.push(`${name}${required ? "" : "?"}:${s}${t === type ? "" : "[]"}`);
    } else {
      res.push(`${name}${required ? "" : "?"}:any`);
    }
  }
  return res.join("\n");
}

export function genResponses() {
  const schemas = apiService.api.$apis;
  const res = [];
  for (const api of schemas.values()) {
    const k = api.key.replace(/\//g, "_").replace(/:/g, "_");
    const n = firstUpperCase(underscore2camelCase(k));
    if (api.options.title) {
      res.push(`/** ${api.options.title} 参数 */`);
    }
    const params = api.options.responseSchema as any;
    if (!params) {
      res.push(`export type IResponse${n} = any;`);
      continue;
    }
    res.push(`export interface IResponse${n} {`);
    for (const name of Object.keys(params.fields || {})) {
      const param = schemaToInterface(name, params.fields[name]);
      res.push(param);
    }
    res.push(`}\n`);
  }
  if (res.length === 0) {
    res.push("export default {};");
  } else {
    res.unshift(`import {${Array.from(SCHEMAS).join(",")}} from "./schemas.gen" \n`);
  }
  return res.join("\n");
}

// console.log(genResponses());

import apiService from "../../src/api";
import { ISchemaType } from "erest/dist/lib/params";
import { firstUpperCase, underscore2camelCase } from "../../src/global/base/utils";

function schemaToInterface(name: string, schema: ISchemaType, isRequired = false) {
  const required = schema.required || isRequired;
  const res = [];
  if (schema.comment) {
    res.push(`/** ${schema.comment} */`);
  }
  if (apiService.type.has(schema.type)) {
    if (schema.type === "ENUM" && Array.isArray(schema.params)) {
      res.push(`${name}${required ? "" : "?"}:${typeof schema.params[0]};`);
    } else {
      const type = apiService.type.get(schema.type);
      let teType = type.info.tsType || "any";
      res.push(`${name}${required ? "" : "?"}:${teType};`);
    }
  } else {
    res.push(`${name}${required ? "" : "?"}:any`);
  }
  return res.join("\n");
}

export function genParams() {
  const schemas = apiService.api.$apis;
  const res = [];
  for (const api of schemas.values()) {
    const k = api.key.replace(/\//g, "_").replace(/:/g, "_");
    const n = firstUpperCase(underscore2camelCase(k));
    if (api.options.title) {
      res.push(`/** ${api.options.title} 参数 */`);
    }
    res.push(`export interface IParams${n} {`);
    const params = api.options._allParams;
    for (const name of params.keys()) {
      const param = schemaToInterface(name, params.get(name), api.options.required.has(name));
      res.push(param);
    }
    res.push(`}\n`);
  }
  return res.join("\n");
}

genParams();

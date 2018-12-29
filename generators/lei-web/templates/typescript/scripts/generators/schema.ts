import apiService from "../../src/api";

function mapType(type: string) {
  if (type.indexOf("String") > -1) return "string";
  if (type.indexOf("Integer") > -1) return "number";
  if (type.indexOf("Date") > -1) return "Date";
  console.log("----", type);
  return "any";
}

function genSchemaInterface(key: string, schema: any) {
  const desc = Object.entries((schema as any).fields).map(([key, value]) => {
    const v = value as any;
    const type = mapType(v.type);
    const comment = typeof v.comment === "string" ? v.comment : "";
    return `/** ${comment || key} */\n${key}: ${type};`;
  });
  return `export interface ISchema${key} {\n ${desc.join("\n")} \n};`;
}

export function genSchemaFile() {
  const res = [""];
  apiService.schema.forEach((schema, key) => key && res.push(genSchemaInterface(key, schema)));
  if (res.length === 1) res.push("export default {};");
  return res.join("\n");
}
// console.log(genSchemaFile());

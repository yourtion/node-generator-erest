import apiService from "../../src/api";

function genTypeString(key, type) {
  return ` /** ${type.description} */
${key}: "${key}",`;
}

function genSchemaString(key, schema) {
  const desc = Object.entries((schema as any).fields).map(([key, value]) => {
    const v = value as any;
    const type = typeof v.type === "string" ? v.type : "";
    const comment = typeof v.comment === "string" ? v.comment : "";
    return `* @param ${key} ${comment} (${type})`;
  });
  return ` /** \n * ${key} \n ${desc.join("\n")} \n */
${key}: "${key}",
${key}Array: "${key}[]",`;
}

export function genTypesFile() {
  const res = ["export const TYPES = {"];
  apiService.type.forEach((value, key) => key && res.push(genTypeString(key, value.info)));
  res.push("};");
  res.push("");
  res.push("export const SCHEMAS = {");
  apiService.schema.forEach((schema, key) => key && res.push(genSchemaString(key, schema)));
  res.push("};");

  return res.join("\n");
}
genTypesFile();

import apiService from "../../src/api";

function genTypeString(key, type) {
  return ` /** ${type.description} */
${key}: "${key}",`;
}

export function genTypesFile() {
  const res = ["export const TYPES = {"];
  apiService.type.forEach((value, key) => res.push(genTypeString(key, value.info)));
  res.push("};");
  return res.join("\n");
}
genTypesFile();

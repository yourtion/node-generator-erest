import apiService from "../api";

function genTypeString(type) {
  return ` /** ${type.description} */
${type.name}: "${type.name}",`;
}

export function genTypesFile() {
  const res = ["export const TYPES = {"];
  apiService.type.forEach(value => res.push(genTypeString(value)));
  res.push("};");
  return res.join("\n");
}
genTypesFile();

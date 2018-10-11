export interface IGenParam {
  import: string;
  symbol: string[];
  content: string[];
}
export function genCoreFile(model?: IGenParam, service?: IGenParam) {
  const res = [`import { BaseService, BaseModel, CoreGen } from "../../core";\n`];
  if(model) res.push(model.import + "\n");
  if(service) res.push(service.import + "\n");

  if(service) {
    res.push(service.symbol.join("\n"));
    res.push(`export class Service extends CoreGen<BaseService> {
      ${service.content.join("\n")}
    }`);
  } else {
    res.push(`export class Service extends CoreGen<BaseService> {}`);
  }

  // res.push(`export class Router extends CoreGen<BaseRouter> {}\n`);
  // res.push(`export class Controller extends CoreGen<BaseController> {}\n`);
  if(model) {
    res.push(model.symbol.join("\n"));
    res.push(`export class Model extends CoreGen<BaseModel> {
      ${model.content.join("\n")}
    }`);
  } else {
    res.push(`export class Model extends CoreGen<BaseModel> {}`);
  }

  return res.join("\n");
}

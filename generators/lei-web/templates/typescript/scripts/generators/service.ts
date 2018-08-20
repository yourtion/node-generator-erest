import fs from "fs";
import path from "path";
import util from "util";
import { firstLowerCase } from "../../src/global/base/utils";

const readdirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);

function getServiceExport(files: string[]) {
  const res = [
    `/**
 * @file service export
 * @author Yourtion Guo <yourtion@gmail.com>
 */
`,
  ];
  for (const f of files) {
    res.push(`export * from "./${f}";`);
  }
  return res.join("\n");
}

export async function genService() {
  const dirPath = path.resolve(__dirname, "../../src/services");
  const list = await readdirAsync(dirPath);
  const files = [];
  const services = [];
  const symbols = [];
  const serviceGen = [];
  for (const file of list) {
    const ext = path.extname(file);
    if (file.indexOf("index") !== 0 && ext === ".ts") {
      const content = await readFileAsync(path.resolve(dirPath, file));
      const lines = content.toString().split("\n");
      let comment;
      for (const line of lines) {
        const commentMatch = line.match(/\s+\* (.*)/);
        if (commentMatch && commentMatch[1]) {
          comment = commentMatch[1].replace(/\s+/g, "");
          continue;
        }
        const match = line.match("^export class(.*)extends BaseService(.*)");
        if (match && match[1]) {
          files.push(file.replace(".ts", ""));
          const ser = match[1].replace(/\s+/g, "");
          services.push(ser);
          symbols.push(`const ${ser.toUpperCase()}_M_SYM = Symbol("${ser.toUpperCase()}");`);
          if (comment) {
            serviceGen.push(`/** ${comment} */`);
          }
          serviceGen.push(`get ${firstLowerCase(ser).replace("Service", "")}() {
            return this.getCache(${ser.toUpperCase()}_M_SYM, ${ser});
          }`);
          break;
        }
      }
    }
  }
  const serviceImport = `import { ${services.join(", ")} } from "../../services";`;
  const serviceExport = getServiceExport(files);
  return { files, services, serviceGen, symbols, serviceImport, serviceExport };
}

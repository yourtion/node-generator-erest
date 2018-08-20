/**
 * 代码生成
 * @author Yourtion Guo <yourtion@gmail.com>
 */

/* tslint:disable: no-console */

import path from "path";
require("../src/app");

const FILE_PATH = path.resolve(__dirname, "../src/global/gen");
import { prettierSaveFile } from "./utils";

import config from "../src/global/base/config";
import {
  genConfigFile,
  genErrorFile,
  genModels,
  genTypesFile,
  genCoreFile,
  genParams,
  genService,
  genTest,
} from "./generators/index";

function getModelsPath(name: string) {
  const suffix = name === "index" ? ".ts" : ".m.ts";
  return path.resolve(__dirname, "../src/models/", name + suffix);
}

async function main() {
  const errorsFilePath = FILE_PATH + "/errors.gen.ts";
  await prettierSaveFile(errorsFilePath, genErrorFile(), true);

  const typeFilePath = FILE_PATH + "/types.gen.ts";
  await prettierSaveFile(typeFilePath, genTypesFile(), true);

  const configFilePath = FILE_PATH + "/config.gen.ts";
  await prettierSaveFile(configFilePath, genConfigFile(), true);

  const paramsFilePath = FILE_PATH + "/params.gen.ts";
  await prettierSaveFile(paramsFilePath, genParams(), true);

  const modelsGenPath = FILE_PATH + "/models.gen.ts";

  const { tableGen, schemas, indexs, tableImport, coreModelGen, coreModelSymbl } = await genModels(config.tablePrefix);
  await prettierSaveFile(modelsGenPath, tableGen.join("\n"), true);

  for (const model of Object.keys(schemas)) {
    const file = getModelsPath(model);
    const modelString = schemas[model];
    await prettierSaveFile(file, modelString);
  }

  const modelIndex = getModelsPath("index");
  await prettierSaveFile(modelIndex, indexs.join("\n"), true);

  const services = await genService();

  const serviceIndex = path.resolve(__dirname, "../src/services/index.ts");
  await prettierSaveFile(serviceIndex, services.serviceExport, true);

  const coreFilePath = FILE_PATH + "/core.gen.ts";
  await prettierSaveFile(
    coreFilePath,
    genCoreFile(
      { import: tableImport, symbol: coreModelSymbl, content: coreModelGen },
      { import: services.serviceImport, symbol: services.symbols, content: services.serviceGen }
    ),
    true
  );

  const apiTestPath = path.resolve(__dirname, "../test/api/api.gen.ts");
  await prettierSaveFile(apiTestPath, genTest(), true);
}

main()
  .then(() => {
    console.log("OK");
    process.exit(0);
  })
  .catch(console.log);

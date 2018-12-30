/**
 * 代码生成
 * @author Yourtion Guo <yourtion@gmail.com>
 */

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
  genSchemaFile,
  genResponses,
} from "./generators/index";

function getModelsPath(name: string) {
  const suffix = name === "index" ? ".ts" : ".m.ts";
  return path.resolve(__dirname, "../src/models/", name + suffix);
}

async function main() {
  console.log("start");

  const errorsFilePath = FILE_PATH + "/errors.gen.ts";
  await prettierSaveFile(errorsFilePath, genErrorFile(), true);
  console.log("generated -> errors");

  const typeFilePath = FILE_PATH + "/types.gen.ts";
  await prettierSaveFile(typeFilePath, genTypesFile(), true);
  console.log("generated -> types");

  const configFilePath = FILE_PATH + "/config.gen.ts";
  await prettierSaveFile(configFilePath, genConfigFile(), true);
  console.log("generated -> config");

  const paramsFilePath = FILE_PATH + "/params.gen.ts";
  await prettierSaveFile(paramsFilePath, genParams(), true);
  console.log("generated -> params");

  const schemaFilePath = FILE_PATH + "/schemas.gen.ts";
  await prettierSaveFile(schemaFilePath, genSchemaFile(), true);
  console.log("generated -> schema");

  const responseFilePath = FILE_PATH + "/responses.gen.ts";
  await prettierSaveFile(responseFilePath, genResponses(), true);
  console.log("generated -> responses");

  let modelConfig;

  if (config.mysql) {
    const modelsGenPath = FILE_PATH + "/models.gen.ts";

    const { tableGen, schemas, indexs, tableImport, coreModelGen, coreModelSymbl } = await genModels(
      config.tablePrefix
    );
    await prettierSaveFile(modelsGenPath, tableGen.join("\n"), true);

    for (const model of Object.keys(schemas)) {
      const file = getModelsPath(model);
      const modelString = schemas[model];
      await prettierSaveFile(file, modelString);
    }

    const modelIndex = getModelsPath("index");
    await prettierSaveFile(modelIndex, indexs.join("\n"), true);
    console.log("generated -> models");
    modelConfig = { import: tableImport, symbol: coreModelSymbl, content: coreModelGen };
  }

  const services = await genService();

  const serviceIndex = path.resolve(__dirname, "../src/services/index.ts");
  await prettierSaveFile(serviceIndex, services.serviceExport, true);
  console.log("generated -> services");

  const coreFilePath = FILE_PATH + "/core.gen.ts";
  await prettierSaveFile(
    coreFilePath,
    genCoreFile(modelConfig, {
      import: services.serviceImport,
      symbol: services.symbols,
      content: services.serviceGen,
    }),
    true
  );
  console.log("generated -> core");

  const apiTestPath = path.resolve(__dirname, "../test/api/api.gen.ts");
  await prettierSaveFile(apiTestPath, genTest(), true);
  console.log("generated -> tests");
}

main()
  .then(() => {
    console.log("OK");
    process.exit(0);
  })
  .catch(console.log);

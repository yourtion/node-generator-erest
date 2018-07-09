import {  writeFileSync } from "fs";

// const json = JSON.parse(readFileSync("../docs/doc.json").toString());

import json from "../docs/doc.json";

interface IPostManHeader {
  key: string;
  value: string;
  description?: string;
}

interface IPostManRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  header: IPostManHeader[]
}

interface IPostManFolders {
  name: string;
  description?: string;
  item: IPostManItem[];
}

interface IPostManItem {
  name: string,
  request: IPostManRequest;
}

function getHeader() {
  return {
    key: "Content-Type",
    value: "application/json",
  }
}

const postman = {
  variables: [{
    enabled: true,
    key: "HOST",
    value: json.info.host + json.info.basePath,
    type: "text"
  }],
  info: {
    "name": json.info.title,
    "_postman_id": "",
    "description": json.info.description,
    "schema": "https://schema.getpostman.com/json/collection/v2.0.0/collection.json",
  },
  item: [] as IPostManFolders[],
}

const groups: any = {};

for(const g in json.group) {
  groups[g] = {
    id: g,
    name: json.group[g],
    items: [] as IPostManItem[],
  }
}

for(const key in json.schemas) {
  const item = json.schemas[key];
  const req: IPostManItem = {
    name: item.title,
    request: {
      url: "{{HOST}}" + item.realPath,
      method: String(item.method).toLocaleUpperCase(),
      header: []
    } as IPostManRequest,
  };
  req.request.header.push(getHeader());
  groups[item.group].items.push(req)
}

for(const g in groups) {
  const gg = groups[g];
  postman.item.push({
    name: gg.name,
    item: gg.items,
  })
}

writeFileSync("../docs/postman.json", JSON.stringify(postman));

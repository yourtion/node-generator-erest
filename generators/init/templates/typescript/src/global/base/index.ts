/**
 * @file libs export
 * @author Yourtion Guo <yourtion@gmail.com>
 */

export interface IKVObject<T= any> {
  [key: string]: T;
}

export interface IPageParams {
  page: number;
  limit: number;
  offset: number;
  order: string;
  asc: boolean;
}

export * from "../gen/errors.gen";
export * from "./config";

import lodash from "lodash";
export const _ = lodash;

import * as u from "./utils";
export const utils = u;

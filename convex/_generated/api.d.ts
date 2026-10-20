/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as auth from "../auth.js";
import type * as blogs from "../blogs.js";
import type * as cars from "../cars.js";
import type * as crm from "../crm.js";
import type * as dealerships from "../dealerships.js";
import type * as files from "../files.js";
import type * as financing from "../financing.js";
import type * as gallery from "../gallery.js";
import type * as http from "../http.js";
import type * as import_ from "../import.js";
import type * as omnichannel from "../omnichannel.js";
import type * as reviews from "../reviews.js";
import type * as seedAgent from "../seedAgent.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  auth: typeof auth;
  blogs: typeof blogs;
  cars: typeof cars;
  crm: typeof crm;
  dealerships: typeof dealerships;
  files: typeof files;
  financing: typeof financing;
  gallery: typeof gallery;
  http: typeof http;
  import: typeof import_;
  omnichannel: typeof omnichannel;
  reviews: typeof reviews;
  seedAgent: typeof seedAgent;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

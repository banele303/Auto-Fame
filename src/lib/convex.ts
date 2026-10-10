import { ConvexHttpClient } from "convex/browser";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  process.env.CONVEX_URL ||
  "https://reliable-sturgeon-574.convex.cloud";

export const convexClient: any = new ConvexHttpClient(convexUrl);

import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn("WARNING: NEXT_PUBLIC_CONVEX_URL is not set in environment variables.");
}

export const convexClient: any = new ConvexHttpClient(convexUrl || "");

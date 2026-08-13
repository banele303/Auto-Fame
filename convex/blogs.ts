import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    publishedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let posts = await ctx.db.query("posts").collect();

    if (args.publishedOnly) {
      posts = posts.filter(p => p.published);
    }

    // Sort by createdAt desc
    posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (args.limit !== undefined) {
      posts = posts.slice(0, args.limit);
    }

    return posts;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .first();
  },
});

export const get = query({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    published: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaKeywords: v.optional(v.array(v.string())),
    authorId: v.optional(v.string()),
    authorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lastPost = await ctx.db.query("posts").order("desc").first();
    const nextId = lastPost ? lastPost.id + 1 : 1;

    // Check unique slug
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .first();
    if (existing) {
      throw new Error("A post with this slug already exists.");
    }

    const now = new Date().toISOString();

    const postId = await ctx.db.insert("posts", {
      id: nextId,
      title: args.title,
      slug: args.slug,
      content: args.content,
      excerpt: args.excerpt || null,
      coverImage: args.coverImage || null,
      tags: args.tags,
      published: args.published || false,
      metaTitle: args.metaTitle || null,
      metaDescription: args.metaDescription || null,
      metaKeywords: args.metaKeywords || [],
      authorId: args.authorId || null,
      authorName: args.authorName || null,
      publishedAt: args.published ? now : null,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(postId);
  },
});

export const update = mutation({
  args: {
    id: v.number(),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.union(v.string(), v.null())),
    coverImage: v.optional(v.union(v.string(), v.null())),
    tags: v.optional(v.array(v.string())),
    published: v.optional(v.boolean()),
    metaTitle: v.optional(v.union(v.string(), v.null())),
    metaDescription: v.optional(v.union(v.string(), v.null())),
    metaKeywords: v.optional(v.array(v.string())),
    authorId: v.optional(v.union(v.string(), v.null())),
    authorName: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
    if (!post) throw new Error("Blog post not found");

    const { id, ...fields } = args;
    const patch: any = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    patch.updatedAt = new Date().toISOString();

    if (patch.published && !post.published) {
      patch.publishedAt = new Date().toISOString();
    } else if (patch.published === false) {
      patch.publishedAt = null;
    }

    await ctx.db.patch(post._id, patch);
    return await ctx.db.get(post._id);
  },
});

export const remove = mutation({
  args: { id: v.number() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_numeric_id", q => q.eq("id", args.id))
      .first();
    if (!post) throw new Error("Blog post not found");

    await ctx.db.delete(post._id);
    return { success: true };
  },
});


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: skip,
    });

    const total = await prisma.post.count({ where: { published: true } });

    return NextResponse.json({ posts, total, page, limit });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      slug,
      excerpt,
      coverImage,
      tags,
      authorId,
      authorName,
      published,
      publishedAt,
      metaTitle,
      metaDescription,
      metaKeywords
    } = body;

    // Basic validation
    if (!title || !content || !slug) {
        return NextResponse.json({ error: "Title, content and slug are required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug,
        excerpt,
        coverImage,
        tags,
        authorId,
        authorName,
        published: published || false,
        publishedAt: publishedAt
          ? new Date(publishedAt)
          : published
          ? new Date()
          : null,
        metaTitle,
        metaDescription,
        metaKeywords
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

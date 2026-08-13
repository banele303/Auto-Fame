
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  try {
    const post = await prisma.post.findUnique({
      where: { slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  try {
    const body = await request.json();
    // Prevent updating slug if not necessary or handle it carefully
    // For now allow updating all fields
    const {
        title,
        content,
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

    const post = await prisma.post.update({
      where: { slug },
      data: {
        title,
        content,
        excerpt,
        coverImage,
        tags,
        authorId,
        authorName,
        published,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        metaTitle,
        metaDescription,
        metaKeywords
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to update post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { slug: string } }
  ) {
    const { slug } = params;
  
    try {
      await prisma.post.delete({
        where: { slug },
      });
  
      return NextResponse.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Failed to delete post:", error);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }
  }

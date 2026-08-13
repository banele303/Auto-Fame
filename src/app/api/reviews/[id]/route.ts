import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for review updates
const updateReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5").optional(),
  title: z.string().min(1, "Title is required").optional(),
  comment: z.string().min(1, "Comment is required").optional(),
});

// GET a specific review
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            dealership: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Review GET: Error fetching review", error);
    return NextResponse.json(
      { error: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

// PATCH update a review
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: validatedData,
      include: {
        car: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            dealership: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If rating was updated, recalculate car's average rating
    if (validatedData.rating !== undefined) {
      const reviews = await prisma.review.findMany({
        where: { carId: existingReview.carId },
        select: { rating: true },
      });

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await prisma.car.update({
        where: { id: existingReview.carId },
        data: {
          averageRating: averageRating,
        },
      });
    }

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("Review PATCH: Error updating review", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE a review
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id },
    });

    // Recalculate car's average rating and review count
    const reviews = await prisma.review.findMany({
      where: { carId: existingReview.carId },
      select: { rating: true },
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    await prisma.car.update({
      where: { id: existingReview.carId },
      data: {
        averageRating: averageRating,
        numberOfReviews: reviews.length,
      },
    });

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Review DELETE: Error deleting review", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}

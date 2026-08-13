"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { StarIcon } from "lucide-react";
import { useGetAuthUserQuery } from "@/state/api";

interface CarReviewFormProps { 
  carId: number; 
  onReviewSubmitted: () => void;
}

const CarReviewForm = ({ carId, onReviewSubmitted }: CarReviewFormProps) => { 
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: authUser } = useGetAuthUserQuery(undefined);

  const isCustomer = authUser?.userRole?.toLowerCase() === "customer"; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCustomer) {
      toast.error("Permission Denied", {
        description: "Only customers can submit reviews"
      });
      return;
    }

    if (rating === 0) {
      toast.error("Rating Required", {
        description: "Please select a rating before submitting"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/reviews", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carId, 
          rating,
          comment,
          customerId: authUser?.userInfo?.id, 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      toast.success("Review Submitted", {
        description: "Thank you for your feedback!"
      });
      
      setRating(0);
      setComment("");
      onReviewSubmitted();
    } catch (error) {
      toast.error("Error", {
        description: "Failed to submit your review. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCustomer) { 
    return (
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
        <p className="text-amber-800 text-sm">
          Only customers can submit reviews for cars.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <h3 className="text-lg font-semibold">Write a Review</h3>
      
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none"
          >
            <StarIcon
              className={`w-8 h-8 ${
                star <= (hoverRating || rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              } transition-colors duration-150`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating} star${rating !== 1 ? "s" : ""}` : "Select rating"}
        </span>
      </div>

      <Textarea
        placeholder="Share your experience with this car..." 
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[120px]"
      />

      <Button 
        type="submit" 
        disabled={isSubmitting || rating === 0}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
};

export default CarReviewForm;

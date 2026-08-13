"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateReviewMutation } from '@/state/api';

interface CarReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  carId: number;
  carDetails: {
    make: string;
    model: string;
    year: number;
    price: number;
  };
}

const CarReviewForm: React.FC<CarReviewFormProps> = ({
  isOpen,
  onClose,
  carId,
  carDetails
}) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const [createReview, { isLoading }] = useCreateReviewMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !comment.trim() || !customerName.trim() || !customerEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }

    try {
      
      const reviewData = {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        carId,
        customerId: "temp-customer-1", // Using a temporary customer ID as string
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim()
      };

      await createReview(reviewData).unwrap();
      
      toast.success('Review submitted successfully!');
      
      
      setRating(5);
      setTitle('');
      setComment('');
      setCustomerName('');
      setCustomerEmail('');
      onClose();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to submit review. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleRatingHover = (hoveredRating: number) => {
    setHoveredRating(hoveredRating);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">
            Write a Review for {carDetails.year} {carDetails.make} {carDetails.model}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Your Name *</Label>
                <Input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Your Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            
            <div>
              <Label className="text-sm font-medium">Rating *</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-8 w-8 cursor-pointer transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => handleRatingHover(star)}
                    onMouseLeave={handleRatingLeave}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {rating} out of 5 stars
                </span>
              </div>
            </div>

            
            <div>
              <Label htmlFor="title">Review Title *</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/100 characters
              </p>
            </div>

            
            <div>
              <Label htmlFor="comment">Your Review *</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience with this car..."
                rows={5}
                maxLength={1000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/1000 characters
              </p>
            </div>

            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Car Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                  <p className="font-medium">{carDetails.year} {carDetails.make} {carDetails.model}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Price:</span>
                  <p className="font-medium">R {carDetails.price.toLocaleString()}</p>
                </div>
              </div>
            </div>

            
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !title.trim() || !comment.trim() || !customerName.trim() || !customerEmail.trim()}
                className="bg-[#00acee] hover:bg-[#0099d4]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarReviewForm;

"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, User, Calendar } from 'lucide-react';
import { useGetReviewsQuery } from '@/state/api';
import { format } from 'date-fns';

interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  reviewDate: Date | string;
  customerName?: string;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CarReviewsProps {
  carId: number;
}

const CarReviews: React.FC<CarReviewsProps> = ({ carId }) => {
  const { data: reviews, isLoading, error } = useGetReviewsQuery({ carId });

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-16 w-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Unable to load reviews at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  const carReviews = reviews?.filter((review: Review) => review.id) || [];
  
  
  const averageRating = carReviews.length > 0 
    ? carReviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / carReviews.length
    : 0;

  
  const ratingCounts = {
    5: carReviews.filter((r: Review) => r.rating === 5).length,
    4: carReviews.filter((r: Review) => r.rating === 4).length,
    3: carReviews.filter((r: Review) => r.rating === 3).length,
    2: carReviews.filter((r: Review) => r.rating === 2).length,
    1: carReviews.filter((r: Review) => r.rating === 1).length,
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        {carReviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No reviews yet</div>
            <p className="text-sm text-gray-400">
              Be the first to share your experience with this car!
            </p>
          </div>
        ) : (
          <>
            
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold">
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on {carReviews.length} review{carReviews.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-8">{stars}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-yellow-400 h-full rounded-full"
                        style={{ 
                          width: `${carReviews.length > 0 ? (ratingCounts[stars as keyof typeof ratingCounts] / carReviews.length) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                      {ratingCounts[stars as keyof typeof ratingCounts]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            
            <div className="space-y-6">
              {carReviews.map((review: Review) => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {review.rating} stars
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{review.title}</h3>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(review.reviewDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {review.comment}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>
                      {review.customerName || review.customer?.name || 'Anonymous'}
                    </span>
                    <Calendar className="h-4 w-4 ml-2" />
                    <span>
                      {format(new Date(review.reviewDate), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CarReviews;

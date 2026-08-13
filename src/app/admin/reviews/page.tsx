"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, User, Car, Calendar, Trash2, Eye, Search, Filter } from "lucide-react";
import { useGetReviewsQuery, useDeleteReviewMutation } from "@/state/api";
import AdminNavigation from "@/components/AdminNavigation";
import { toast } from "sonner";

interface ReviewWithRelations {
  id: number;
  rating: number;
  title: string;
  comment: string;
  reviewDate: Date | string;
  carId: number;
  customerId: string;
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    dealership?: {
      name: string;
    };
  };
  customer?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [selectedReview, setSelectedReview] = useState<ReviewWithRelations | null>(null);

  
  const { data: reviews = [], isLoading, refetch } = useGetReviewsQuery({});
  const [deleteReview] = useDeleteReviewMutation();

  
  const filteredAndSortedReviews = useMemo(() => {
    const filtered = reviews.filter((review: any) => {
      const matchesSearch = 
        review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.customer?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${review.car?.make || ''} ${review.car?.model || ''}`.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating = !ratingFilter || ratingFilter === "all" || review.rating.toString() === ratingFilter;

      return matchesSearch && matchesRating;
    });

    
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime();
        case "date-asc":
          return new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime();
        case "rating-desc":
          return b.rating - a.rating;
        case "rating-asc":
          return a.rating - b.rating;
        case "customer":
          return (a.customer?.name || "").localeCompare(b.customer?.name || "");
        case "car":
          return `${a.car?.make || ''} ${a.car?.model || ''}`.localeCompare(`${b.car?.make || ''} ${b.car?.model || ''}`);
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, searchTerm, ratingFilter, sortBy]);

  
  const stats = useMemo(() => {
    const totalReviews = reviews.length;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
      : 0;
    
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter((review: any) => review.rating === rating).length,
      percentage: totalReviews > 0 ? (reviews.filter((review: any) => review.rating === rating).length / totalReviews) * 100 : 0
    }));

    return {
      total: totalReviews,
      average: averageRating,
      distribution: ratingDistribution
    };
  }, [reviews]);

  const handleDeleteReview = async (reviewId: number) => {
    if (confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      try {
        await deleteReview(reviewId).unwrap();
        toast.success("Review deleted successfully");
        refetch();
      } catch (error) {
        toast.error("Failed to delete review");
      }
    }
  };

  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "bg-green-100 text-green-800";
    if (rating >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
     
     
      
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
        <p className="text-gray-600">Manage customer reviews and ratings</p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{stats.average.toFixed(1)}</p>
              <div className="flex">
                {renderStars(Math.round(stats.average))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">5-Star Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {stats.distribution.find(d => d.rating === 5)?.count || 0}
            </p>
            <p className="text-sm text-gray-500">
              {stats.distribution.find(d => d.rating === 5)?.percentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Ratings (1-2★)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {(stats.distribution.find(d => d.rating === 1)?.count || 0) + 
               (stats.distribution.find(d => d.rating === 2)?.count || 0)}
            </p>
            <p className="text-sm text-gray-500">Need attention</p>
          </CardContent>
        </Card>
      </div>

      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviews, customers, or cars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="rating-desc">Highest Rating</SelectItem>
                  <SelectItem value="rating-asc">Lowest Rating</SelectItem>
                  <SelectItem value="customer">Customer Name</SelectItem>
                  <SelectItem value="car">Car Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <div className="space-y-4">
        {filteredAndSortedReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 text-lg">No reviews found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedReviews.map((review) => {
            const reviewWithRelations = review as ReviewWithRelations;
            return (
            <Card key={reviewWithRelations.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <Badge className={getRatingColor(reviewWithRelations.rating)}>
                        {reviewWithRelations.rating} ⭐
                      </Badge>
                      <h3 className="font-semibold text-lg text-gray-900">{reviewWithRelations.title}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <div>
                          <p className="font-medium">{reviewWithRelations.customer?.name || 'Unknown Customer'}</p>
                          <p className="text-sm text-gray-500">{reviewWithRelations.customer?.email || 'No email'}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Car className="w-4 h-4 mr-2" />
                        <div>
                          <p className="font-medium">
                            {reviewWithRelations.car?.make || 'Unknown'} {reviewWithRelations.car?.model || 'Car'} {reviewWithRelations.car?.year || ''}
                          </p>
                          <p className="text-sm text-gray-500">{reviewWithRelations.car?.dealership?.name || 'Unknown Dealership'}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <p className="text-sm">{formatDate(reviewWithRelations.reviewDate)}</p>
                      </div>
                    </div>

                    <p className="text-gray-700 leading-relaxed">{reviewWithRelations.comment}</p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReview(reviewWithRelations)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Review Details</DialogTitle>
                        </DialogHeader>
                        {selectedReview && (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex">{renderStars(selectedReview.rating)}</div>
                              <span className="font-medium">{selectedReview.rating}/5</span>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-lg">{selectedReview.title}</h4>
                              <p className="text-gray-700 mt-2">{selectedReview.comment}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Customer</p>
                                <p className="font-medium">{selectedReview.customer?.name}</p>
                                <p className="text-sm text-gray-600">{selectedReview.customer?.email}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Vehicle</p>
                                <p className="font-medium">
                                  {selectedReview.car?.make} {selectedReview.car?.model} {selectedReview.car?.year}
                                </p>
                                <p className="text-sm text-gray-600">{selectedReview.car?.dealership?.name}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-500">Review Date</p>
                              <p className="text-sm">{formatDate(selectedReview.reviewDate)}</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReview(reviewWithRelations.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      
      {filteredAndSortedReviews.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Showing {filteredAndSortedReviews.length} of {reviews.length} reviews
          </p>
        </div>
      )}
    </div>
  );
}

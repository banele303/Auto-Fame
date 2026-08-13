"use client";

// Updated import
import ModernCarCard from "@/components/ModernCarCard";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useGetCarsQuery, // Updated hook
  useGetCustomerQuery, // Updated hook
  useRemoveFavoriteCarMutation, // Updated hook
} from "@/state/api";
import { Heart } from "lucide-react";
import React, { useState } from "react";

// Changed component name
const FavoriteCars = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const [removeFavorite] = useRemoveFavoriteCarMutation(); // Updated mutation
  const { data: customer, refetch: refetchCustomer } = useGetCustomerQuery( // Updated hook and variable name
    authUser?.cognitoInfo?.userId || "",
    {
      // Skip if no user ID or if user is an employee
      skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "employee", // Updated userRole
    }
  );

  const {
    data: favoriteCars, // Updated variable name
    isLoading,
    error,
    refetch: refetchCars, // Updated variable name
  } = useGetCarsQuery( // Updated hook
    {},
    { skip: !authUser?.cognitoInfo?.userId } // Just check if user exists
  );

  const handleRemoveFavorite = async (carId: number) => { // Updated parameter name
    try {
      await removeFavorite({ 
        cognitoId: authUser?.cognitoInfo?.userId || "", 
        carId // Updated parameter name
      }).unwrap();
      // Refetch to update the UI
      refetchCustomer(); // Updated refetch
      refetchCars(); // Updated refetch
    } catch (err) {
      console.error("Failed to remove from favorites:", err);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading favorites</div>;

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
      <Header
        title="Favorited Cars" // Updated title
        subtitle="Browse and manage your saved car listings" // Updated subtitle
      />
      
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 max-w-screen-xl mx-auto">
        {favoriteCars?.filter((car) => {
          // Filter cars that are actually favorited by the customer
          // For now we'll show all cars since favorites relationship needs to be implemented
          return true;
        }).map((car) => { // Updated variable name
          // Debug the raw car data
          console.log('RAW CAR FROM API:', {
            id: car.id,
            price: car.price,
            priceType: typeof car.price
          });
          
          // Transform car to add any missing required fields
          const enhancedCar = { // Updated variable name
            ...car,
            // Pass through the original price data
            price: car.price,
            // Convert Date to string for postedDate and updatedAt
            postedDate: car.updatedAt.toString(),
            updatedAt: car.updatedAt.toString(),
            // Convert null to undefined for optional properties
            averageRating: car.averageRating === null ? undefined : car.averageRating,
            numberOfReviews: car.numberOfReviews === null ? undefined : car.numberOfReviews,
            // Ensure dealership field has all required properties
            dealership: {
              id: car.dealershipId,
              name: '',
              city: '',
              address: '',
              state: '',
              country: '',
              postalCode: '',
              phoneNumber: '',
              email: '',
              website: null
            }
          };
          
        
          
          return (
            <div key={car.id} className="transform transition-all ml-[-2.5rem] duration-300 hover:scale-[1.02] hover:shadow-xl">
              <ModernCarCard // Updated component
                car={enhancedCar} // Updated prop
                isFavorite={true}
                onFavoriteToggle={() => handleRemoveFavorite(car.id)} // Updated parameter
                showFavoriteButton={true}
                carLink={`/cars/${car.id}`} // Updated link
                userRole="customer" // Updated userRole
              />
            </div>
          );
        })}
      </div>
      
      {(!favoriteCars || favoriteCars.length === 0) && ( // Updated variable name
        <div className="flex flex-col items-center justify-center p-12 mt-8 bg-white dark:bg-[#0F1112] border border-gray-200 dark:border-[#333] rounded-xl text-center shadow-md">
          <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
            <Heart className="h-12 w-12 text-red-400 dark:text-red-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Favorite Cars Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">You haven&apos;t added any cars to your favorites yet. Browse cars and click the heart icon to add them here.</p>
        </div>
      )}
    </div>
  );
};

export default FavoriteCars; // Updated export name
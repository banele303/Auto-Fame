"use client";

// Updated import
import ModernCarCard from "@/components/ModernCarCard";
import Header from "@/components/Header";
import Loading from "@/components/Loading";
import {
  useGetAuthUserQuery,
  useGetSalesQuery, // Updated hook
  useGetCustomerQuery, // Updated hook
} from "@/state/api";
import { Car, DollarSign } from "lucide-react"; // Updated icons
import React from "react";
import { normalizeFuelType } from '@/lib/constants';

// Changed component name
const Purchases = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: customer } = useGetCustomerQuery( // Updated hook
    authUser?.cognitoInfo?.userId || "",
    {
      // Skip if no user ID or if user is an employee
      skip: !authUser?.cognitoInfo?.userId || authUser?.userRole === "employee", // Updated userRole
    }
  );

  // Pass 'skip' as the argument when the user isn't a customer to prevent API calls
  const shouldSkip = !authUser?.cognitoInfo?.userId || authUser?.userRole === "employee";
  const {
    data: sales,
    isLoading,
    error,
  } = useGetSalesQuery( // Updated hook
    shouldSkip ? undefined : { customerId: authUser?.cognitoInfo?.userId || "" }, // Updated param
    {
      // We still need the skip condition for when the component first renders
      skip: shouldSkip,
    }
  );

  if (isLoading) return <Loading />;
  if (error) return <div>Error loading purchases</div>; // Updated text

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="My Car Purchases" // Updated title
        subtitle="View and manage your purchased vehicles" // Updated subtitle
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {sales?.map((sale) => {
          // The sale object should have the car data included from the API
          const car = sale.car;
          
          if (!car) {
            return null; // Skip if no car data
          }
          
          // Ensure we have a properly structured car for ModernCarCard
          const transformedCar = {
            ...car,
            // Ensure all required properties have default values
            price: car.price || sale.salePrice || 0,
            mileage: car.mileage || 0,
            year: car.year || 0,
            // Convert enum values to strings
            condition: car.condition || 'USED',
            carType: car.carType || 'SEDAN',
            fuelType: (normalizeFuelType(car.fuelType as any) || car.fuelType || 'PETROL'),
            transmission: car.transmission || 'AUTOMATIC',
            // Ensure string properties exist
            engine: car.engine || '',
            exteriorColor: car.exteriorColor || '',
            interiorColor: car.interiorColor || '',
            description: car.description || '',
            status: car.status || 'AVAILABLE',
            // Use sale date as fallback for posting date
            postedDate: sale.saleDate ? sale.saleDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            updatedAt: sale.saleDate ? sale.saleDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            // The dealership should come from the sale object
            dealership: sale.dealership || { 
              id: 0,
              name: '', 
              address: '',
              city: '', 
              state: '', 
              country: '', 
              postalCode: '', 
              phoneNumber: '', 
              email: '', 
              website: null 
            },
            // Convert null to undefined for optional properties
            averageRating: car.averageRating === null ? undefined : car.averageRating,
            numberOfReviews: car.numberOfReviews === null ? undefined : car.numberOfReviews,
            // Ensure arrays exist
            features: car.features || [],
            photoUrls: car.photoUrls || []
          };
          
          return (
            <div key={sale.id} className="transform transition-all ml-[-2.5rem] duration-300 hover:scale-[1.02] hover:shadow-xl">
              <ModernCarCard
                car={transformedCar}
                isFavorite={false}
                onFavoriteToggle={() => {}}
                showFavoriteButton={false}
                carLink={`/cars/${car.id}`}
                userRole="customer"
              />
            </div>
          );
        })}
      </div>
      
      {(!sales || sales.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 mt-8 bg-white dark:bg-[#0F1112] border border-gray-200 dark:border-[#333] rounded-xl text-center shadow-md">
          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
            <DollarSign className="h-12 w-12 text-blue-400 dark:text-blue-500" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Car Purchases Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">You haven&apos;t purchased any cars yet. Browse our inventory to find your dream car!</p>
        </div>
      )}
    </div>
  );
};

export default Purchases; // Updated export name

"use client";

import Header from "@/components/Header";
import { Car, FileText, Heart, MessageSquare, Calendar, DollarSign, CreditCard } from "lucide-react";
import Link from "next/link";
import React from "react";

const CustomerDashboard = () => {
  
  const mockCustomer = {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    favorites: [1, 2, 3], // Car IDs
    purchases: [1],
    inquiries: [1, 2],
    testDrives: [1],
    financingApplications: [1]
  };

  const mockInquiries = [
    {
      id: 1,
      carId: 1,
      status: "NEW",
      inquiryDate: "2024-01-15",
      car: { make: "Toyota", model: "Camry" }
    },
    {
      id: 2,
      carId: 2,
      status: "IN_PROGRESS",
      inquiryDate: "2024-01-10",
      car: { make: "Honda", model: "Accord" }
    }
  ];

  const mockFavoriteCars = [
    {
      id: 1,
      make: "Toyota",
      model: "Camry",
      year: 2024,
      price: 35000,
      mileage: 0,
      condition: "NEW",
      carType: "SEDAN",
  fuelType: "FUEL",
      transmission: "AUTOMATIC",
      engine: "2.5L 4-Cylinder",
      exteriorColor: "Silver",
      interiorColor: "Black",
      description: "Brand new Toyota Camry with excellent fuel efficiency",
      features: ["Backup Camera", "Bluetooth", "Lane Assist"],
      photoUrls: ["/placeholder.jpg"],
      status: "AVAILABLE",
      postedDate: "2024-01-01",
      updatedAt: "2024-01-01",
      dealershipId: 1,
      dealership: {
        id: 1,
        name: "Toyota Downtown",
        address: "123 Main St",
        city: "Johannesburg",
        state: "Gauteng",
        country: "South Africa",
        postalCode: "2000",
        phoneNumber: "+27 11 123 4567",
        email: "info@toyotadowntown.co.za",
        website: "https://toyotadowntown.co.za"
      }
    },
    {
      id: 2,
      make: "Honda",
      model: "Accord",
      year: 2023,
      price: 32000,
      mileage: 15000,
      condition: "USED",
      carType: "SEDAN",
  fuelType: "FUEL",
      transmission: "AUTOMATIC",
      engine: "1.5L Turbo",
      exteriorColor: "White",
      interiorColor: "Beige",
      description: "Well-maintained Honda Accord with low mileage",
      features: ["Sunroof", "Heated Seats", "Navigation"],
      photoUrls: ["/placeholder.jpg"],
      status: "AVAILABLE",
      postedDate: "2024-01-05",
      updatedAt: "2024-01-05",
      dealershipId: 2,
      dealership: {
        id: 2,
        name: "Honda Central",
        address: "456 Oak Ave",
        city: "Cape Town",
        state: "Western Cape",
        country: "South Africa",
        postalCode: "8000",
        phoneNumber: "+27 21 987 6543",
        email: "info@hondacentral.co.za",
        website: "https://hondacentral.co.za"
      }
    }
  ];

  
  const newInquiriesCount = mockInquiries.filter(
    (inq) => inq.status === "NEW"
  ).length;

  return (
    <div className="dashboard-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header
        title="Customer Dashboard"
        subtitle="Welcome back! Here's an overview of your car journey"
      />
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        <DashboardCard
          title="Favorites"
          count={mockCustomer.favorites.length}
          icon={<Heart className="h-6 w-6" />}
          link="/customers/favorites"
          color="bg-gradient-to-br from-rose-500 to-pink-600"
        />
        <DashboardCard
          title="My Cars"
          count={mockCustomer.purchases.length}
          icon={<Car className="h-6 w-6" />}
          link="/customers/purchases"
          color="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <DashboardCard
          title="Inquiries"
          count={mockCustomer.inquiries.length}
          icon={<MessageSquare className="h-6 w-6" />}
          link="/customers/inquiries"
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <DashboardCard
          title="New Inquiries"
          count={newInquiriesCount}
          icon={<FileText className="h-6 w-6" />}
          link="/customers/inquiries"
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
      </div>
      
      
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Favorite Cars</h2>
          <Link href="/customers/favorites" className="text-blue-500 hover:underline">View all</Link>
        </div>
        
        {mockFavoriteCars && mockFavoriteCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {mockFavoriteCars.slice(0, 3).map((car) => (
              <div key={car.id} className="bg-[#0F1112] border border-[#333] rounded-xl p-6 hover:border-[#555] transition-colors">
                <div className="aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                  <Car className="h-12 w-12 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {car.year} {car.make} {car.model}
                </h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-blue-400">
                    R{car.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400">
                    {car.mileage.toLocaleString()} km
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white bg-green-600 px-2 py-1 rounded">
                    Available
                  </span>
                  <Link 
                    href={`/cars/${car.id}`}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-[#0F1112] border border-[#333] rounded-xl text-center">
            <Heart className="h-8 w-8 text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">No Favorite Cars Yet</h3>
            <p className="text-gray-400">Start adding cars to your favorites to see them here.</p>
          </div>
        )}
      </div>

      
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Inquiries</h2>
          <Link href="/customers/inquiries" className="text-blue-500 hover:underline">View all</Link>
        </div>
        
        {mockInquiries && mockInquiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0F1112] text-gray-300">
                  <th className="p-4 border-b border-[#333]">Car</th>
                  <th className="p-4 border-b border-[#333]">Status</th>
                  <th className="p-4 border-b border-[#333]">Inquiry Date</th>
                  <th className="p-4 border-b border-[#333]">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockInquiries.slice(0, 3).map((inquiry) => (
                  <tr key={inquiry.id} className="border-b border-[#222] hover:bg-[#1A1B1E]">
                    <td className="p-4">{`${inquiry.car?.make} ${inquiry.car?.model}` || "Unknown Car"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        inquiry.status === "COMPLETED" ? "bg-green-900 text-green-300" :
                        inquiry.status === "CANCELLED" ? "bg-red-900 text-red-300" :
                        inquiry.status === "NEW" ? "bg-yellow-900 text-yellow-300" :
                        "bg-blue-900 text-blue-300"
                      }`}>
                        {inquiry.status?.charAt(0).toUpperCase() + inquiry.status?.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4">{new Date(inquiry.inquiryDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <Link 
                        href={`/cars/${inquiry.carId}`}
                        className="text-blue-500 hover:underline"
                      >
                        View Car
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-[#0F1112] border border-[#333] rounded-xl text-center">
            <FileText className="h-8 w-8 text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">No Inquiries</h3>
            <p className="text-gray-400">You haven&apos;t submitted any car inquiries yet.</p>
          </div>
        )}
      </div>

      
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/inventory"
            className="bg-[#0F1112] border border-[#333] rounded-xl p-6 hover:border-[#555] transition-colors text-center"
          >
            <Car className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">Browse Cars</h3>
            <p className="text-gray-400 text-sm">Explore our inventory of available vehicles</p>
          </Link>
          
          <Link 
            href="/customers/test-drives"
            className="bg-[#0F1112] border border-[#333] rounded-xl p-6 hover:border-[#555] transition-colors text-center"
          >
            <Calendar className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">Schedule Test Drive</h3>
            <p className="text-gray-400 text-sm">Book a test drive for your favorite cars</p>
          </Link>
          {/* Financing quick action removed per request */}
        </div>
      </div>
    </div>
  );
};


const DashboardCard = ({ 
  title, 
  count, 
  icon, 
  link, 
  color 
}: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  link: string; 
  color: string;
}) => {
  return (
    <Link href={link}>
      <div className={`${color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <div className="p-2 bg-white/20 rounded-full">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-semibold text-white mt-4">{count}</p>
      </div>
    </Link>
  );
};

export default CustomerDashboard;
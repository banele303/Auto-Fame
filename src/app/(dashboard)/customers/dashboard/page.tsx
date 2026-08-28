"use client";

import { Car, FileText, Heart, MessageSquare, Calendar } from "lucide-react";
import Link from "next/link";
import React from "react";

const CustomerDashboard = () => {
  const mockCustomer = {
    id: 1,
    name: "Customer",
    email: "customer@example.com",
    favorites: [1, 2, 3],
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
      price: 350000,
      mileage: 12000,
      condition: "NEW",
      carType: "SEDAN",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      photoUrls: ["/placeholder.svg"],
      status: "AVAILABLE",
    },
    {
      id: 2,
      make: "Honda",
      model: "Accord",
      year: 2023,
      price: 320000,
      mileage: 25000,
      condition: "USED",
      carType: "SEDAN",
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      photoUrls: ["/placeholder.svg"],
      status: "AVAILABLE",
    }
  ];

  const newInquiriesCount = mockInquiries.filter(i => i.status === "NEW").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Customer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Welcome back. Manage your saved vehicles, test drive requests, and inquiries.
          </p>
        </div>
        <div>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-medium shadow-sm transition-all"
          >
            <Car className="w-3.5 h-3.5" />
            Browse Inventory
          </Link>
        </div>
      </div>
      
      {/* Vercel Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Saved Favorites"
          count={mockCustomer.favorites.length}
          icon={<Heart className="h-4 w-4 text-zinc-400" />}
          link="/customers/favorites"
          description="Vehicles in wishlist"
        />
        <DashboardCard
          title="Purchased Cars"
          count={mockCustomer.purchases.length}
          icon={<Car className="h-4 w-4 text-zinc-400" />}
          link="/customers/purchases"
          description="Verified orders"
        />
        <DashboardCard
          title="All Inquiries"
          count={mockCustomer.inquiries.length}
          icon={<MessageSquare className="h-4 w-4 text-zinc-400" />}
          link="/customers/inquiries"
          description="Direct dealer chats"
        />
        <DashboardCard
          title="Active Inquiries"
          count={newInquiriesCount}
          icon={<FileText className="h-4 w-4 text-zinc-400" />}
          link="/customers/inquiries"
          description="Awaiting response"
        />
      </div>
      
      {/* Favorite Cars */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-white">Saved Vehicles</h2>
            <p className="text-xs text-zinc-500 font-mono">Vehicles you have bookmarked for review</p>
          </div>
          <Link href="/customers/favorites" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors">
            View all →
          </Link>
        </div>
        
        {mockFavoriteCars && mockFavoriteCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockFavoriteCars.slice(0, 2).map((car) => (
              <div key={car.id} className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {car.status}
                      </span>
                      <h3 className="text-base font-semibold text-white mt-2">
                        {car.year} {car.make} {car.model}
                      </h3>
                    </div>
                    <span className="text-lg font-mono font-semibold text-white">
                      R {car.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono space-x-3 mb-4">
                    <span>{car.mileage.toLocaleString()} km</span>
                    <span>•</span>
                    <span>{car.fuelType}</span>
                    <span>•</span>
                    <span>{car.transmission}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-[#1c1c1c] flex items-center justify-between">
                  <span className="text-xs text-zinc-500">AutoFame Certified</span>
                  <Link 
                    href={`/cars/${car.id}`}
                    className="text-xs font-medium text-white hover:underline"
                  >
                    View Vehicle →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-[#222] rounded-xl text-center">
            <Heart className="h-6 w-6 text-zinc-600 mb-2" />
            <h3 className="text-sm font-medium text-white">No Favorite Cars Yet</h3>
            <p className="text-xs text-zinc-500 mt-1">Start adding cars to your favorites to see them here.</p>
          </div>
        )}
      </div>

      {/* Inquiries Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Inquiries</h2>
            <p className="text-xs text-zinc-500 font-mono">Your latest questions and dealership requests</p>
          </div>
          <Link href="/customers/inquiries" className="text-xs font-mono text-zinc-400 hover:text-white transition-colors">
            View all →
          </Link>
        </div>
        
        {mockInquiries && mockInquiries.length > 0 ? (
          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black border-b border-[#222] text-zinc-400 font-mono uppercase tracking-wider">
                  <th className="py-3 px-4">Car</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Inquiry Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockInquiries.slice(0, 3).map((inquiry) => (
                  <tr key={inquiry.id} className="border-b border-[#1c1c1c] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{`${inquiry.car?.make} ${inquiry.car?.model}` || "Unknown Car"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                        inquiry.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        inquiry.status === "CANCELLED" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        inquiry.status === "NEW" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {inquiry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{new Date(inquiry.inquiryDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <Link 
                        href={`/cars/${inquiry.carId}`}
                        className="text-xs font-medium text-white hover:underline"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-[#222] rounded-xl text-center">
            <FileText className="h-6 w-6 text-zinc-600 mb-2" />
            <h3 className="text-sm font-medium text-white">No Inquiries</h3>
            <p className="text-xs text-zinc-500 mt-1">You haven&apos;t submitted any car inquiries yet.</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/inventory"
            className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5 hover:border-zinc-700 transition-all flex items-center gap-4 group"
          >
            <div className="p-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 group-hover:text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Browse Showroom</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Explore available verified pre-owned vehicles</p>
            </div>
          </Link>
          
          <Link 
            href="/contact-us"
            className="bg-[#0a0a0a] border border-[#222] rounded-xl p-5 hover:border-zinc-700 transition-all flex items-center gap-4 group"
          >
            <div className="p-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-zinc-300 group-hover:text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Schedule Test Drive</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Book a test drive at 1 Rifle Range Rd, Baragwanath</p>
            </div>
          </Link>
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
  description 
}: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  link: string; 
  description?: string;
}) => {
  return (
    <Link href={link}>
      <div className="bg-[#0a0a0a] border border-[#222] hover:border-zinc-700 transition-all rounded-xl p-5 group">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
          <span>{title}</span>
          <div className="group-hover:text-white transition-colors">{icon}</div>
        </div>
        <p className="text-3xl font-semibold text-white font-mono tracking-tight mb-1">{count}</p>
        {description && <p className="text-[11px] text-zinc-500 font-mono">{description}</p>}
      </div>
    </Link>
  );
};

export default CustomerDashboard;
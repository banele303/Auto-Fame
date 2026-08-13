"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetAuthUserQuery, useGetAllCustomersQuery } from "@/state/api"; 
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Mail, Phone, UserRound, User2, Car, MessageSquare, DollarSign } from "lucide-react"; 
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeletons";


type Customer = {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  dateOfBirth: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  favoriteCarsCount?: number;
  inquiryCount?: number;
  salesCount?: number;
};


type CustomerDetails = {
  customerInfo: {
    id: number;
    cognitoId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    favoriteCarsCount?: number;
    inquiryCount?: number;
    salesCount?: number;
  };
  favorites: {
    id: number;
    make: string;
    model: string;
    year: number;
    dealership: {
      name: string;
    };
  }[];
  inquiries: {
    id: number;
    car: {
      id: number;
      make: string;
      model: string;
      dealership: {
        name: string;
      };
    };
    status: string;
    inquiryDate: string;
  }[];
  sales: {
    id: number;
    car: {
      id: number;
      make: string;
      model: string;
      dealership: {
        name: string;
      };
    };
    saleDate: string;
    salePrice: number;
  }[];
};

export default function CustomersPage() { 
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  
  const viewEmployeeDetails = (employeeId: string) => { 
    router.push(`/admin/employees/${employeeId}`); 
  };
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: authUser } = useGetAuthUserQuery();
  const { data: customers, isLoading: isLoadingCustomers } = useGetAllCustomersQuery(); 
  
  const router = useRouter();

  const filteredCustomers = customers ? customers.filter(customer => { 
    const fullName = customer.name.toLowerCase(); 
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) : [];

  
  const totalPages = Math.ceil((filteredCustomers?.length || 0) / itemsPerPage);
  const paginatedCustomers = filteredCustomers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  
  const viewCustomerDetails = (customer: Customer) => { 
    router.push(`/admin/customers/${customer.cognitoId}`); 
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1> 
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search customers..." 
            className="w-full bg-white dark:bg-slate-950 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoadingCustomers ? (
        <TableSkeleton rows={8} />
      ) : customers && customers.length === 0 ? (
        <div className="text-center p-8 text-slate-500 dark:text-slate-400">
          No customers found in the database 
        </div>
      ) : filteredCustomers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">No matching customers found</p> 
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedCustomers.map((customer) => ( 
            <Card key={customer.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium">{customer.name}</h3> 
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{customer.phoneNumber}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    {(customer as any).favoriteCarsCount ?? 0} Favorite Cars 
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                    {(customer as any).inquiryCount ?? 0} Inquiries 
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    {(customer as any).salesCount ?? 0} Sales 
                  </Badge>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-100"
                    onClick={() => viewCustomerDetails(customer)} 
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      
      {customers && customers.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
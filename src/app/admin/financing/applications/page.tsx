"use client";

import { useState, useEffect } from 'react';
import { fetchAuthSession } from '@/app/admin/adminAuth';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Search, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';

type FinancingApplication = {
  id: number;
  customerName: string;
  carModel: string;
  applicationDate: string;
  amount: number;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  creditScore: number | null;
  documentCount: number;
};

export default function FinancingApplicationsPage() {
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const applicationsPerPage = 10;

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        setAuthError(null);
        // Retrieve ID token for authorized API access
        let token: string | undefined;
        try {
          const session = await fetchAuthSession();
          token = session.tokens?.idToken?.toString();
        } catch (e) {
          console.warn('Unable to fetch auth session for financing applications list:', e);
        }
        const params: string[] = [];
        if (statusFilter !== 'all') params.push(`status=${encodeURIComponent(statusFilter)}`);
        const qs = params.length ? `?${params.join('&')}` : '';
  // Use admin endpoint so we get consistent shaping & auth
  const res = await fetch(`/api/admin/financing/applications${qs}` , {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        });
        if (!res.ok) throw new Error(`Failed to fetch applications (${res.status})`);
        const raw = await res.json();

        // Map backend shape -> UI shape
        const mapped: FinancingApplication[] = (raw || []).map((r: any) => ({
          id: r.id,
          customerName: r.customerName || r.customer?.name || r.customerEmail || 'Unknown',
          carModel: r.carModel || 'Vehicle not specified',
          applicationDate: r.applicationDate || r.createdAt || new Date().toISOString(),
          amount: typeof r.amount === 'string' ? parseFloat(r.amount) : (r.amount ?? r.loanAmount) || 0,
          status: r.status || 'PENDING',
          creditScore: r.creditScore ?? null,
          documentCount: typeof r.documentCount === 'number' ? r.documentCount : (Array.isArray(r.documents) ? r.documents.length : 0),
        }));

        // Client-side search filter (customerName / carModel)
        const lowered = searchTerm.trim().toLowerCase();
        const filtered = lowered
          ? mapped.filter(m => 
              m.customerName.toLowerCase().includes(lowered) || 
              m.carModel.toLowerCase().includes(lowered) ||
              (m.carModel !== 'Vehicle not specified' && m.carModel.toLowerCase().includes(lowered))
            )
          : mapped;

        setTotalApplications(filtered.length);

        // Pagination slice
        const start = (currentPage - 1) * applicationsPerPage;
        const pageSlice = filtered.slice(start, start + applicationsPerPage);
        setApplications(pageSlice);
      } catch (error: any) {
        console.error('Error fetching applications:', error);
        if (String(error.message || '').includes('401')) {
          setAuthError('You are not authorized to view financing applications. Log in with an admin or finance role.');
        }
        setApplications([]);
        setTotalApplications(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplications();
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };
  
  const totalPages = Math.max(1, Math.ceil(totalApplications / applicationsPerPage));
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-500">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };
  
  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'bg-green-500';
    if (score >= 650) return 'bg-green-300';
    if (score >= 580) return 'bg-amber-500';
    if (score >= 500) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financing Applications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and review customer financing applications
          </p>
          {authError && (
            <p className="mt-2 text-sm text-red-600 font-medium">{authError}</p>
          )}
        </div>
        <Button asChild>
          <Link href="/admin/financing/applications/new">
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Link>
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input 
                  type="search"
                  placeholder="Search by customer name or vehicle model..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </form>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="block md:hidden space-y-4">
            {isLoading ? (
              [...Array(4)].map((_,i)=>(
                <div key={i} className="border rounded-lg p-4 space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              ))
            ) : applications.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">{searchTerm || statusFilter !== 'all' ? 'No applications match your search criteria' : 'No financing applications found'}</p>
            ) : (
              applications.map(app => (
                <div key={app.id} className="border rounded-lg p-4 bg-white dark:bg-gray-900 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{app.customerName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{app.carModel || 'Vehicle not specified'}</p>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Date</p>
                      <p className="font-medium">{new Date(app.applicationDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Amount</p>
                      <p className="font-medium">R{app.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Credit</p>
                      <p className="font-medium flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${getCreditScoreColor(app.creditScore ?? 0)}`}></span>
                        {app.creditScore || 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Button variant="outline" size="sm" asChild className="w-full mt-1">
                        <Link href={`/admin/financing/applications/${app.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {!isLoading && applications.length > 0 && (
              <div className="pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalApplications}
                  itemsPerPage={applicationsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
          <div className="hidden md:block overflow-x-auto px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? "No applications match your search criteria" 
                        : "No financing applications found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.customerName}</TableCell>
                      <TableCell>{app.carModel || 'Vehicle not specified'}</TableCell>
                      <TableCell>{new Date(app.applicationDate).toLocaleDateString()}</TableCell>
                      <TableCell>R{app.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${getCreditScoreColor(app.creditScore ?? 0)}`}></div>
                          <span>{app.creditScore || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className='text-xs font-medium'>{app.documentCount}</span></TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/financing/applications/${app.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="hidden md:block px-6">
            {!isLoading && applications.length > 0 && (
              <div className="py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalApplications}
                  itemsPerPage={applicationsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

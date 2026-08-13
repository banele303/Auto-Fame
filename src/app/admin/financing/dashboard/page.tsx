"use client";

import { useState, useEffect } from 'react';
import { fetchAuthSession } from '@/app/admin/adminAuth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronRight,
  FileText,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';

type FinancingApplication = {
  id: string;
  customerName: string;
  carModel: string;
  applicationDate: string;
  amount: number;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  creditScore: number;
};

type FinancingStats = {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  averageProcessingDays: number;
  totalFinancingAmount: number;
  monthlyGrowth: {
    applications: number;
    approvalRate: number;
  };
  applicationsByNSFAS: {
    total: number;
    approved: number;
  };
};

export default function FinancingDashboardPage() {
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
  const [stats, setStats] = useState<FinancingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancingData = async () => {
      setIsLoading(true);
      try {
        // Fetch financing applications data
        let token: string | undefined;
        try {
          const session = await fetchAuthSession();
          token = session.tokens?.idToken?.toString();
        } catch (e) {
          console.warn('Auth session not available for dashboard fetch:', e);
        }
        const applicationsRes = await fetch('/api/admin/financing/applications?limit=5', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!applicationsRes.ok) throw new Error('Failed to fetch applications');
        const applicationsData = await applicationsRes.json();
        
        // Fetch financing statistics
        const statsRes = await fetch('/api/admin/financing/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!statsRes.ok) throw new Error('Failed to fetch statistics');
        const statsData = await statsRes.json();
        
        setApplications(applicationsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching financing data:', error);
        // Fallback data
        setApplications([]);
        setStats({
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          averageProcessingDays: 0,
          totalFinancingAmount: 0,
          monthlyGrowth: {
            applications: 0,
            approvalRate: 0,
          },
          applicationsByNSFAS: {
            total: 0,
            approved: 0,
          }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFinancingData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-2" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financing Dashboard</h1>
        <Button asChild>
          <Link href="/admin/financing/applications/new">New Application</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Applications
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total}</div>
            <p className="text-xs flex items-center text-gray-600 dark:text-gray-400">
              {stats?.monthlyGrowth?.applications && stats.monthlyGrowth.applications > 0 ? (
                <>
                  <ArrowUpRight className="text-green-500 mr-1 h-3 w-3" />
                  <span className="text-green-500">{stats.monthlyGrowth.applications}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="text-red-500 mr-1 h-3 w-3" />
                  <span className="text-red-500">{Math.abs(stats?.monthlyGrowth?.applications || 0)}%</span>
                </>
              )}
              <span className="ml-1">vs. last month</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Approval Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats && stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs flex items-center text-gray-600 dark:text-gray-400">
              {stats?.monthlyGrowth?.approvalRate && stats.monthlyGrowth.approvalRate > 0 ? (
                <>
                  <ArrowUpRight className="text-green-500 mr-1 h-3 w-3" />
                  <span className="text-green-500">{stats.monthlyGrowth.approvalRate}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="text-red-500 mr-1 h-3 w-3" />
                  <span className="text-red-500">{Math.abs(stats?.monthlyGrowth?.approvalRate || 0)}%</span>
                </>
              )}
              <span className="ml-1">vs. last month</span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Financing Amount
            </CardTitle>
            <BarChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              R{stats?.totalFinancingAmount?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              For approved applications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg. Processing Time
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.averageProcessingDays?.toFixed(1) || '0'} days
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              From application to decision
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Approved</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats && stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                  </span>
                </div>
                <Progress value={stats && stats.total > 0 ? (stats.approved / stats.total) * 100 : 0} className="h-2 bg-gray-200" indicatorClassName="bg-green-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rejected</span>
                  <span className="text-sm font-medium text-red-600">
                    {stats && stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%
                  </span>
                </div>
                <Progress value={stats && stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0} className="h-2 bg-gray-200" indicatorClassName="bg-red-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending</span>
                  <span className="text-sm font-medium text-amber-600">
                    {stats && stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                  </span>
                </div>
                <Progress value={stats && stats.total > 0 ? (stats.pending / stats.total) * 100 : 0} className="h-2 bg-gray-200" indicatorClassName="bg-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">NSFAS Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-2xl font-bold">{stats?.applicationsByNSFAS?.total || 0}</div>
                  <div className="text-sm text-gray-500">Total Applications</div>
                </div>
                <PieChart className="h-10 w-10 text-purple-600 opacity-20" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Approval Rate</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats && stats.applicationsByNSFAS && stats.applicationsByNSFAS.total > 0 
                      ? Math.round((stats.applicationsByNSFAS.approved / stats.applicationsByNSFAS.total) * 100) 
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats && stats.applicationsByNSFAS && stats.applicationsByNSFAS.total > 0 
                    ? (stats.applicationsByNSFAS.approved / stats.applicationsByNSFAS.total) * 100 
                    : 0} 
                  className="h-2 bg-gray-200" 
                  indicatorClassName="bg-purple-600" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <div className="text-center p-6">
              <TrendingUp className="h-24 w-24 text-blue-500 opacity-20 mx-auto mb-4" />
              <Button asChild className="mt-4">
                <Link href="/admin/financing/analytics">View Full Analytics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Financing Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Credit Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No financing applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.customerName}</TableCell>
                      <TableCell>{app.carModel}</TableCell>
                      <TableCell>{new Date(app.applicationDate).toLocaleDateString()}</TableCell>
                      <TableCell>R{app.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${getCreditScoreColor(app.creditScore)}`}></div>
                          <span>{app.creditScore}</span>
                        </div>
                      </TableCell>
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
          
          <div className="flex justify-center mt-6">
            <Button variant="outline" asChild>
              <Link href="/admin/financing/applications">View All Applications</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

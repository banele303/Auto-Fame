"use client";

import { useGetAllEmployeesQuery, useUpdateEmployeeStatusMutation, useDeleteEmployeeMutation, useGetAuthUserQuery } from "@/state/api"; 
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertTriangle, Ban, Search, Plus, User } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { fetchAuthSession } from "../adminAuth";

export default function EmployeesPage() { 
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || "all");
  
  
  type Employee = {
    id: number;
    cognitoId: string;
    name: string;
    email: string;
    phoneNumber?: string; 
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; 
  };
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null); 
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "SALES_ASSOCIATE" as "SALES_MANAGER" | "SALES_ASSOCIATE" | "FINANCE_MANAGER" | "SERVICE_ADVISOR" | "ADMIN",
    dealershipId: "",
    commission: "0"
  });
  
  
  const [dealerships, setDealerships] = useState<Array<{id: number, name: string, city: string}>>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: authUser } = useGetAuthUserQuery();
  const { data: employees, isLoading, refetch } = useGetAllEmployeesQuery({ 
    status: selectedStatus !== "all" ? selectedStatus : undefined 
  }, {
    skip: !authUser?.cognitoInfo?.userId || authUser?.userRole !== "admin"
  });
  const [updateEmployeeStatus] = useUpdateEmployeeStatusMutation(); 
  const [deleteEmployee] = useDeleteEmployeeMutation(); 

  
  const fetchDealerships = async () => {
    try {
      const response = await fetch('/api/dealerships');
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setDealerships(data);
        
        if (data.length > 0) {
          setCreateForm(prev => ({ ...prev, dealershipId: data[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error("Error fetching dealerships:", error);
    }
  };

  
  useEffect(() => {
    if (authUser?.userRole === "admin") {
      fetchDealerships();
    }
  }, [authUser]);

  
  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateFormSelectChange = (name: string, value: string) => {
    setCreateForm(prev => ({ ...prev, [name]: value }));
  };

  
  const handleCreateEmployee = async () => {
    if (!createForm.name || !createForm.email || !createForm.phoneNumber || !createForm.dealershipId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...createForm,
          dealershipId: Number(createForm.dealershipId),
          commission: Number(createForm.commission)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create employee');
      }

      toast.success('Employee created successfully!');
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: "",
        email: "",
        phoneNumber: "",
        role: "SALES_ASSOCIATE",
        dealershipId: dealerships.length > 0 ? dealerships[0].id.toString() : "",
        commission: "0"
      });
      refetch();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast.error(error.message || 'Failed to create employee');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredEmployees = employees?.filter(employee => { 
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  
  const totalPages = Math.ceil((filteredEmployees?.length || 0) / itemsPerPage);
  const paginatedEmployees = filteredEmployees?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = async () => {
    if (!selectedEmployee || !newStatus) return; 
    
    try {
      await updateEmployeeStatus({
        id: selectedEmployee.cognitoId, 
        status: newStatus as any 
      }).unwrap();
      
      setIsDialogOpen(false);
      setSelectedEmployee(null); 
      setNewStatus("");
      setNotes("");
      refetch();
    } catch (error) {
      console.error("Failed to update employee status:", error);
    }
  };

  const openStatusDialog = (employee: Employee, initialStatus: string) => { 
    setSelectedEmployee(employee); 
    setNewStatus(initialStatus);
    setIsDialogOpen(true);
  };
  
  const openDeleteDialog = (employee: Employee) => { 
    setSelectedEmployee(employee); 
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteEmployee = async () => { 
    if (!selectedEmployee) return; 
    
    try {
      await deleteEmployee(selectedEmployee.cognitoId).unwrap(); 
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null); 
      refetch();
    } catch (error) {
      console.error("Failed to delete employee:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": 
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>;
      case "INACTIVE": 
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Inactive</Badge>;
      case "SUSPENDED": 
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Manage Employees</h1> 
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem> 
            <SelectItem value="INACTIVE">Inactive</SelectItem> 
            <SelectItem value="SUSPENDED">Suspended</SelectItem> 
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : filteredEmployees?.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No employees found matching your criteria.</p> 
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedEmployees?.map((employee) => ( 
            <Card key={employee.id} className="p-4 bg-white dark:bg-gray-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-medium">{employee.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{employee.phoneNumber}</p>
                  <div className="mt-2">{getStatusBadge(employee.status)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  
                  
                  
                  {(employee.status === "INACTIVE" || employee.status === "SUSPENDED") && (
                    <Button 
                      variant="outline" 
                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                      onClick={() => openStatusDialog(employee, "ACTIVE")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Activate
                    </Button>
                  )}
                  
                  
                  {employee.status === "ACTIVE" && (
                    <Button 
                      variant="outline" 
                      className="bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      onClick={() => openStatusDialog(employee, "INACTIVE")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Deactivate
                    </Button>
                  )}
                  
                  
                  {employee.status !== "SUSPENDED" && (
                    <Button 
                      variant="outline" 
                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      onClick={() => openStatusDialog(employee, "SUSPENDED")}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Suspend
                    </Button>
                  )}
                  
                  
                  <Button 
                    variant="outline" 
                    className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                    onClick={() => openDeleteDialog(employee)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      
      {(filteredEmployees?.length || 0) > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEmployees?.length || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Employee Status</DialogTitle> 
            <DialogDescription>
              You are about to change {selectedEmployee?.name}&apos;s status to <strong>{newStatus}</strong>. 
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusChange}>
              Confirm Status Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee Account</DialogTitle> 
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{selectedEmployee?.name}</strong>? 
              This action cannot be undone and will remove all associated data. 
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteEmployee}> 
              Permanently Delete 
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Add New Employee
            </DialogTitle>
            <DialogDescription>
              Create a new employee account with access to the dealership system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name *</Label>
                <Input
                  id="create-name"
                  name="name"
                  value={createForm.name}
                  onChange={handleCreateFormChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email Address *</Label>
                <Input
                  id="create-email"
                  name="email"
                  type="email"
                  value={createForm.email}
                  onChange={handleCreateFormChange}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone Number *</Label>
                <Input
                  id="create-phone"
                  name="phoneNumber"
                  value={createForm.phoneNumber}
                  onChange={handleCreateFormChange}
                  placeholder="+27 12 345 6789"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-commission">Commission Rate</Label>
                <Input
                  id="create-commission"
                  name="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={createForm.commission}
                  onChange={handleCreateFormChange}
                  placeholder="0.05"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-role">Role</Label>
                <Select 
                  value={createForm.role}
                  onValueChange={(value) => handleCreateFormSelectChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES_ASSOCIATE">Sales Associate</SelectItem>
                    <SelectItem value="SALES_MANAGER">Sales Manager</SelectItem>
                    <SelectItem value="FINANCE_MANAGER">Finance Manager</SelectItem>
                    <SelectItem value="SERVICE_ADVISOR">Service Advisor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-dealership">Dealership</Label>
                <Select 
                  value={createForm.dealershipId}
                  onValueChange={(value) => handleCreateFormSelectChange("dealershipId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dealership" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealerships.map((dealership) => (
                      <SelectItem key={dealership.id} value={dealership.id.toString()}>
                        {dealership.name} ({dealership.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateEmployee}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Employee
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

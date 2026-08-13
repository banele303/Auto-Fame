"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Building, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Car,
  Users,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { configureAdminAuth, fetchAuthSession } from "../../admin/adminAuth";
import { CardSkeleton } from "@/components/ui/skeletons";

interface Dealership {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    cars: number;
    employees: number;
    sales: number;
  };
}

export default function DealershipsPage() {
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [filteredDealerships, setFilteredDealerships] = useState<Dealership[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDealership, setSelectedDealership] = useState<Dealership | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "South Africa",
    postalCode: "",
    phoneNumber: "",
    email: "",
    website: ""
  });

  
  useEffect(() => {
    const initAuth = async () => {
      try {
        configureAdminAuth();
        const session = await fetchAuthSession();
        if (!session.tokens) {
          console.error("No valid auth session found");
          router.push("/admin-login");
          return;
        }
        setAuthInitialized(true);
        fetchDealerships();
      } catch (error) {
        console.error("Error initializing admin auth:", error);
        router.push("/admin-login");
      }
    };
    
    initAuth();
  }, [router]);

  
  const fetchDealerships = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dealerships');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setDealerships(data);
        setFilteredDealerships(data);
      }
    } catch (error) {
      console.error("Error fetching dealerships:", error);
      toast.error("Failed to fetch dealerships");
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    const filtered = dealerships.filter(dealership =>
      dealership.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealership.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealership.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDealerships(filtered);
  }, [searchTerm, dealerships]);

  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "South Africa",
      postalCode: "",
      phoneNumber: "",
      email: "",
      website: ""
    });
  };

  
  const handleCreateDealership = async () => {
    if (!formData.name || !formData.address || !formData.city || !formData.state || 
        !formData.postalCode || !formData.phoneNumber || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch('/api/dealerships', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dealership');
      }

      toast.success('Dealership created successfully!');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchDealerships();
    } catch (error: any) {
      console.error('Error creating dealership:', error);
      toast.error(error.message || 'Failed to create dealership');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const openEditDialog = (dealership: Dealership) => {
    setSelectedDealership(dealership);
    setFormData({
      name: dealership.name,
      address: dealership.address,
      city: dealership.city,
      state: dealership.state,
      country: dealership.country,
      postalCode: dealership.postalCode,
      phoneNumber: dealership.phoneNumber,
      email: dealership.email,
      website: dealership.website || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateDealership = async () => {
    if (!selectedDealership) return;

    setIsSubmitting(true);
    try {
      
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch('/api/dealerships', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: selectedDealership.id, ...formData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update dealership');
      }

      toast.success('Dealership updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedDealership(null);
      resetForm();
      fetchDealerships();
    } catch (error: any) {
      console.error('Error updating dealership:', error);
      toast.error(error.message || 'Failed to update dealership');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const openDeleteDialog = (dealership: Dealership) => {
    setSelectedDealership(dealership);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDealership = async () => {
    if (!selectedDealership) return;

    setIsSubmitting(true);
    try {
      
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/dealerships?id=${selectedDealership.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete dealership');
      }

      toast.success('Dealership deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedDealership(null);
      fetchDealerships();
    } catch (error: any) {
      console.error('Error deleting dealership:', error);
      toast.error(error.message || 'Failed to delete dealership');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authInitialized) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Dealerships
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create and manage dealership locations
          </p>
        </div>
        
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Dealership
        </Button>
      </div>

      
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search dealerships..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredDealerships.length === 0 ? (
        <Card className="p-8 text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? "No dealerships found matching your search." : "No dealerships found. Create your first dealership to get started."}
          </p>
        </Card>
      ) : (
        /* Dealerships Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDealerships.map((dealership) => (
            <Card key={dealership.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      {dealership.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4" />
                      {dealership.city}, {dealership.state}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(dealership)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(dealership)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{dealership.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{dealership.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{dealership.email}</span>
                  </div>
                  {dealership.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a 
                        href={dealership.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {dealership.website}
                      </a>
                    </div>
                  )}
                </div>

                
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Car className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{dealership._count.cars}</span>
                    </div>
                    <span className="text-xs text-gray-500">Cars</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{dealership._count.employees}</span>
                    </div>
                    <span className="text-xs text-gray-500">Staff</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold">{dealership._count.sales}</span>
                    </div>
                    <span className="text-xs text-gray-500">Sales</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Add New Dealership
            </DialogTitle>
            <DialogDescription>
              Create a new dealership location with all necessary details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Dealership Name *</Label>
                <Input
                  id="create-name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Toyota Sandton"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email Address *</Label>
                <Input
                  id="create-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="info@toyotasandton.co.za"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-address">Street Address *</Label>
              <Input
                id="create-address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                placeholder="123 Main Street"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-city">City *</Label>
                <Input
                  id="create-city"
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  placeholder="Johannesburg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-state">Province/State *</Label>
                <Input
                  id="create-state"
                  name="state"
                  value={formData.state}
                  onChange={handleFormChange}
                  placeholder="Gauteng"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-postalCode">Postal Code *</Label>
                <Input
                  id="create-postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleFormChange}
                  placeholder="2000"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-phoneNumber">Phone Number *</Label>
                <Input
                  id="create-phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  placeholder="+27 11 123 4567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-website">Website</Label>
                <Input
                  id="create-website"
                  name="website"
                  value={formData.website}
                  onChange={handleFormChange}
                  placeholder="https://www.dealership.co.za"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="create-country">Country *</Label>
              <Input
                id="create-country"
                name="country"
                value={formData.country}
                onChange={handleFormChange}
                placeholder="South Africa"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDealership}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Dealership
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Dealership
            </DialogTitle>
            <DialogDescription>
              Update dealership information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Dealership Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address *</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-address">Street Address *</Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City *</Label>
                <Input
                  id="edit-city"
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">Province/State *</Label>
                <Input
                  id="edit-state"
                  name="state"
                  value={formData.state}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">Postal Code *</Label>
                <Input
                  id="edit-postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">Phone Number *</Label>
                <Input
                  id="edit-phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  name="website"
                  value={formData.website}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-country">Country *</Label>
              <Input
                id="edit-country"
                name="country"
                value={formData.country}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedDealership(null);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateDealership}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Dealership
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dealership</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{selectedDealership?.name}</strong>? 
              This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedDealership(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDealership}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Dealership
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

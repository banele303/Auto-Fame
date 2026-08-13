"use client";
import { useState, useEffect, useCallback } from "react";
import { CAR_UPLOAD_SINGLE_MAX_MB, CAR_UPLOAD_TOTAL_MAX_MB, CAR_UPLOAD_MAX_FILES } from "@/config/uploadLimits";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, XCircle, Car } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { configureAdminAuth, fetchAuthSession } from "../../../../admin/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/ui/skeletons";
import Image from "next/image";
import { resolveCarImageUrl } from "@/utils/imageUrl";

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  vin: string;
  carType: string;
  fuelType: string;
  condition: string;
  transmission: string;
  engine: string;
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  description: string;
  dealershipId: number;
  employeeId: number;
  status: string;
  photoUrls: string[];
}

interface Dealership {
  id: number;
  name: string;
  city: string;
}

interface Employee {
  id: number;
  name: string;
}

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function EditCarPage({ params }: PageProps) {
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [car, setCar] = useState<Car | null>(null);
  const carId = params.id;
  const FEATURE_OPTIONS = [
    'Active/adaptive cruise control',
    'Adaptive headlights (varying light distribution)',
    'Navigation',
    'Park distance control (PDC) - front',
    'Park distance control (PDC) - rear',
    'Rear side airbags',
    'Sunroof',
  // Added per request
  'ABS',
  'Airbags',
  'Aircon',
  'Cruise control',
  'Electric Windows',
  'Radio',
  'Sidestep',
  'Tow bar',
  'Nudge bar',
  ];
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  const addCustomFeature = () => {
    const val = newFeature.trim();
    if (!val) return;
    const exists = selectedFeatures.some(f => f.toLowerCase() === val.toLowerCase());
    if (!exists) setSelectedFeatures(prev => [...prev, val]);
    setNewFeature("");
  };

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    price: "",
    vin: "", // vin retained in data but not editable
    carType: "SEDAN",
    fuelType: "GASOLINE", // Changed from FUEL to GASOLINE
    condition: "USED",
    transmission: "AUTOMATIC",
    engine: "",
    exteriorColor: "",
    mileage: "",
    description: "",
    dealershipId: "",
    employeeId: "",
    status: "AVAILABLE",
    featured: false,
  });

  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  interface ImageItem { id: string; source: 'existing' | 'new'; url: string; file?: File; }
  const [items, setItems] = useState<ImageItem[]>([]);
  const [removedExisting, setRemovedExisting] = useState<Set<string>>(new Set());

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
      } catch (error) {
        console.error("Error initializing admin auth:", error);
        router.push("/admin-login");
      }
    };
    
    initAuth();
  }, [router]);

  const fetchCarData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cars/${carId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch car data');
      }
      const carData = await response.json();
      setCar(carData);
      const existing = (carData.photoUrls || []).map((url: string, idx: number) => ({ id: `ex-${idx}-${url}`, source: 'existing' as const, url: resolveCarImageUrl(url) }));
      setItems(existing);
      
  setFormData({
        make: carData.make,
        model: carData.model,
        year: carData.year,
        price: carData.price.toString(),
  vin: carData.vin,
        carType: carData.carType,
        fuelType: carData.fuelType,
        condition: carData.condition,
        transmission: carData.transmission,
        engine: carData.engine,
        exteriorColor: carData.exteriorColor,
  // interiorColor deprecated
        mileage: carData.mileage.toString(),
        description: carData.description || "",
        dealershipId: carData.dealershipId.toString(),
        employeeId: carData.employeeId?.toString() || "",
  status: carData.status,
  featured: !!carData.featured,
      });
  setSelectedFeatures(carData.features || []);
    } catch (error) {
      console.error("Error fetching car:", error);
      toast.error("Failed to load car data");
      router.push("/admin/cars");
    } finally {
      setIsLoading(false);
    }
  }, [carId, router]);

  useEffect(() => {
    if (authInitialized) {
      fetchCarData();
      fetchDealerships();
      fetchEmployees();
    }
  }, [authInitialized, fetchCarData]);

  const fetchDealerships = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        console.error("No auth token available for dealerships fetch");
        return;
      }

      const response = await fetch('/api/dealerships', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setDealerships(data);
      }
    } catch (error) {
      console.error("Error fetching dealerships:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        console.error("No auth token available for employees fetch");
        return;
      }

      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const MAX_PHOTOS = CAR_UPLOAD_MAX_FILES; // centralized limit (34 images)
  const MAX_SINGLE_MB = CAR_UPLOAD_SINGLE_MAX_MB;
  const MAX_TOTAL_MB = CAR_UPLOAD_TOTAL_MAX_MB; // warn only
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const currentCount = items.filter(i => i.source==='existing' && !removedExisting.has(i.url)).length + items.filter(i => i.source==='new').length;
    const files = Array.from(e.target.files);
    const remaining = MAX_PHOTOS - currentCount;
    if (remaining <= 0) { toast.error(`Maximum ${MAX_PHOTOS} images reached.`); e.target.value=''; return; }
    const allowed = files.slice(0, remaining);
    // Size validation (single file)
    for (const f of allowed) {
      const mb = f.size / (1024*1024);
      if (mb > MAX_SINGLE_MB) {
        toast.error(`${f.name} ${(mb).toFixed(1)}MB > ${MAX_SINGLE_MB}MB limit – skipped`);
        return; // abort all to let user pick smaller images
      }
    }
    if (files.length > allowed.length) toast.error(`Only ${allowed.length} added (cap ${MAX_PHOTOS}).`); else toast.success(`${allowed.length} added.`);
    let newItems = allowed.map((file, idx) => ({ id: `new-${Date.now()}-${idx}-${file.name}`, source:'new' as const, url: URL.createObjectURL(file), file }));
    // Warn if total size high (no trimming) so user keeps all 25 if desired.
    if (MAX_TOTAL_MB > 0) {
      const totalBytes = [...items.filter(i=>i.source==='existing' && !removedExisting.has(i.url)), ...newItems].reduce((sum,i)=> sum + (i.file?.size || 0), 0);
      const totalMb = totalBytes / (1024*1024);
      if (totalMb > MAX_TOTAL_MB) {
        toast.warning(`Total selected ≈${totalMb.toFixed(1)}MB exceeds recommended ${MAX_TOTAL_MB}MB. Uploads may be slower.` as any);
      }
    }
    setItems(prev => [...prev, ...newItems]);
    e.target.value='';
  };

  useEffect(() => {
    return () => { items.forEach(i => { if (i.source==='new') URL.revokeObjectURL(i.url); }); };
  }, [items]);
  const removeImage = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const found = items.find(i => i.id === id);
    if (found?.source==='existing') setRemovedExisting(prev => new Set(prev).add(found.url));
    if (found?.source==='new') URL.revokeObjectURL(found.url);
  };
  const moveImage = (from: number, to: number) => {
    setItems(prev => {
      const arr=[...prev];
      const [sp]=arr.splice(from,1); arr.splice(to,0,sp); return arr;
    });
  };
  const setCover = (index: number) => moveImage(index,0);
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index:number) => { e.dataTransfer.setData('text/plain', index.toString()); };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, index:number) => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); if (!isNaN(from) && from!==index) moveImage(from,index); };
  const visibleCount = items.filter(i => i.source==='existing' && !removedExisting.has(i.url)).length + items.filter(i => i.source==='new').length;
  const coverUrl = items[0]?.url;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      // Phase 1: Upload new images individually (like create flow) to avoid huge multipart body
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString() || (typeof window !== 'undefined' ? localStorage.getItem('admin_id_token') : null) || 'admin';

      // Determine intended final order (using current items array order)
      const intendedOrder = [...items];
      const newItemEntries = intendedOrder.filter(i => i.source === 'new');
      const existingItemEntries = intendedOrder.filter(i => i.source === 'existing' && !removedExisting.has(i.url));

      // Map to hold uploaded URL for each new file (key by temporary id)
      const uploadedUrlMap = new Map<string, string>();

      // Upload new images sequentially in UI order for predictable ordering
      for (const entry of newItemEntries) {
        if (!entry.file) continue;
        const fd = new FormData();
        fd.append('photo', entry.file);
        try {
          const uploadResp = await fetch(`/api/cars/${carId}/photos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd,
          });
          if (!uploadResp.ok) {
            let msg = 'Failed to upload image';
            try { const j = await uploadResp.json(); msg = j.message || msg; } catch { try { const t = await uploadResp.text(); if (t) msg = t.slice(0,160); } catch {} }
            throw new Error(msg);
          }
          const payload = await uploadResp.json();
          if (payload?.url) uploadedUrlMap.set(entry.id, payload.url);
        } catch (err:any) {
          console.error('[EDIT_CAR][UPLOAD_ERROR]', err);
          toast.error(err.message || 'Image upload failed');
          throw err; // abort entire submit
        }
      }

      // Build final ordered URL list (existing kept + newly uploaded) in the intended order
      const finalOrderedUrls: string[] = [];
      for (const entry of intendedOrder) {
        if (entry.source === 'existing') {
          if (!removedExisting.has(entry.url) && !entry.url.startsWith('blob:') && !entry.url.startsWith('data:')) {
            finalOrderedUrls.push(entry.url);
          }
        } else if (entry.source === 'new') {
          const remoteUrl = uploadedUrlMap.get(entry.id);
          if (remoteUrl && !remoteUrl.startsWith('blob:') && !remoteUrl.startsWith('data:')) {
            finalOrderedUrls.push(remoteUrl);
          }
        }
      }

      // Phase 2: Send metadata & ordering update (no photos payload now)
      const metaForm = new FormData();
      Object.entries(formData).forEach(([key,value]) => { if (value !== undefined && value !== null) metaForm.append(key, value.toString()); });
      metaForm.append('features', JSON.stringify(selectedFeatures));
      metaForm.set('featured', formData.featured ? 'true' : 'false');
      metaForm.append('photoUrls', JSON.stringify(finalOrderedUrls)); // ensures deletions processed
      metaForm.append('photoOrder', JSON.stringify(finalOrderedUrls)); // ensures ordering applied

      const metaResp = await fetch(`/api/cars/${carId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: metaForm,
      });
      if (!metaResp.ok) {
        let message = 'Failed to update car';
        try { const j = await metaResp.json(); message = j.message || message; }
        catch { try { const t = await metaResp.text(); if (t) message = t.slice(0,300); } catch {} }
        throw new Error(message);
      }

      toast.success('Car updated successfully!');
      router.push('/admin/cars');
    } catch (error) {
      console.error('Error updating car:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update car');
      } else {
        toast.error('Failed to update car');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show full skeleton only during initial auth/car fetch (not during submit update)
  if (!authInitialized || (!car && isLoading)) {
    return <FormSkeleton />;
  }

  if (!car) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-slate-500">Car not found</p>
          <Button onClick={() => router.push('/admin/cars')} className="mt-4">
            Back to Cars
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Car
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Update car information
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/cars')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cars
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader>
            <CardTitle>Car Details</CardTitle>
            <CardDescription>Update the car information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input 
                  id="make" 
                  name="make" 
                  value={formData.make}
                  onChange={handleChange}
                  placeholder="Toyota, Honda, etc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input 
                  id="model" 
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Corolla, Civic, etc."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input 
                  id="year" 
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (R)</Label>
                <Input 
                  id="price" 
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 139900"
                  required
                  min="0"
                  step="100" /* allow 139900 etc */
                />
                <p className="text-[11px] text-slate-500">Supports prices like 139900; use whole Rand amounts.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage (km)</Label>
                <Input 
                  id="mileage" 
                  name="mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carType">Car Type</Label>
                <Select 
                  value={formData.carType}
                  onValueChange={(value) => handleSelectChange("carType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select car type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEDAN">Sedan</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="HATCHBACK">Hatchback</SelectItem>
                    <SelectItem value="COUPE">Coupe</SelectItem>
                    <SelectItem value="CONVERTIBLE">Convertible</SelectItem>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel</Label>
                <Select 
                  value={formData.fuelType}
                  onValueChange={(value) => handleSelectChange("fuelType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GASOLINE">Petrol</SelectItem>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                    <SelectItem value="ELECTRIC">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select 
                  value={formData.condition}
                  onValueChange={(value) => handleSelectChange("condition", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="USED">Used</SelectItem>
                    <SelectItem value="CERTIFIED_PRE_OWNED">Certified Pre-Owned</SelectItem>
                    <SelectItem value="DEALER_DEMO">Dealer Demo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transmission">Transmission</Label>
                <Select 
                  value={formData.transmission}
                  onValueChange={(value) => handleSelectChange("transmission", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                    <SelectItem value="DUAL_CLUTCH">Dual Clutch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="engine">Engine</Label>
                <Input 
                  id="engine" 
                  name="engine"
                  value={formData.engine}
                  onChange={handleChange}
                  placeholder="e.g. 2.0L Turbo"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exteriorColor">Exterior Color</Label>
                <Input 
                  id="exteriorColor" 
                  name="exteriorColor"
                  value={formData.exteriorColor}
                  onChange={handleChange}
                  placeholder="e.g. White, Black, Silver"
                  required
                />
              </div>
            </div>

            {/* Extras / Features */}
            <div className="space-y-3">
              <Label className="block">Extras</Label>
              <p className="text-xs text-slate-500">Select or deselect applicable extra features.</p>
              <div className="flex flex-wrap gap-2">
                {([...FEATURE_OPTIONS, ...selectedFeatures.filter(f=>!FEATURE_OPTIONS.includes(f))]).map(opt => {
                  const active = selectedFeatures.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedFeatures(prev => active ? prev.filter(f=>f!==opt) : [...prev, opt])}
                      className={`px-3 py-1.5 text-xs rounded-full border transition focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-900
                        ${active ? 'bg-[#00A211] text-white border-[#00A211]' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700'}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {active && <span className="h-2.5 w-2.5 rounded-full bg-white/90 border border-white/30" />}
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedFeatures.length > 0 && (
                <div className="text-xs text-slate-500">{selectedFeatures.length} selected</div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Type extra & press Enter"
                  value={newFeature}
                  onChange={(e)=>setNewFeature(e.target.value)}
                  onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===','){ e.preventDefault(); addCustomFeature(); } }}
                  className="h-8 text-sm w-56"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomFeature} disabled={!newFeature.trim()} className="h-8">Add</Button>
              </div>
            </div>

            {/* VIN not editable */}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed information about the car..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
            <CardDescription>Update car assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dealershipId">Dealership</Label>
                <Select 
                  value={formData.dealershipId}
                  onValueChange={(value) => handleSelectChange("dealershipId", value)}
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
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee</Label>
                <Select 
                  value={formData.employeeId}
                  onValueChange={(value) => handleSelectChange("employeeId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  <SelectItem value="MAINTENANCE">In Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="featured">Featured</Label>
              <div className="flex items-center gap-3 py-2">
                <Switch id="featured" checked={formData.featured} onCheckedChange={(v)=>setFormData(prev=>({...prev, featured: v}))} />
                <span className="text-sm text-slate-600 dark:text-slate-300">Show in Featured Vehicles</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Reorder photos (drag & drop). First image is the cover used on listings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Unified gallery */}
            <div className="space-y-2">
              <Label>Gallery ({visibleCount}/{MAX_PHOTOS})</Label>
              {visibleCount === 0 && <p className="text-xs text-slate-500">No photos yet. Add some below.</p>}
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <div key={item.id}
                       draggable
                       onDragStart={(e)=>onDragStart(e,index)}
                       onDragOver={onDragOver}
                       onDrop={(e)=>onDrop(e,index)}
                       className={`group relative h-20 w-20 rounded-md overflow-hidden border ${index===0 ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800`}> 
                    <Image src={resolveCarImageUrl(item.url)} alt={`Img ${index}`} width={80} height={80} unoptimized className="h-full w-full object-cover pointer-events-none select-none" />
                    <div className="absolute inset-0 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-between">
                        <button type="button" onClick={()=>removeImage(item.id)} className="bg-red-500/80 hover:bg-red-600 text-white px-1 rounded-br text-[10px]">Del</button>
                        <button type="button" onClick={()=>setCover(index)} disabled={index===0} className="bg-blue-500/80 hover:bg-blue-600 disabled:opacity-40 text-white px-1 rounded-bl text-[10px]">Cover</button>
                      </div>
                      <div className="flex justify-between text-[10px] bg-black/40 text-white">
                        <button type="button" disabled={index===0} onClick={()=>moveImage(index,index-1)} className="px-1 disabled:opacity-30">↑</button>
                        <span className="px-1 select-none">{index+1}</span>
                        <button type="button" disabled={index===items.length-1} onClick={()=>moveImage(index,index+1)} className="px-1 disabled:opacity-30">↓</button>
                      </div>
                    </div>
                    {index===0 && <span className="absolute bottom-0 left-0 bg-blue-600 text-white text-[10px] px-1 rounded-tr">Cover</span>}
                  </div>
                ))}
              </div>
              {coverUrl && <p className="text-[11px] text-slate-500 truncate">Cover image selected (Photo 1)</p>}
            </div>

            {/* Uploader */}
            <div className="space-y-2">
              <Label htmlFor="photos">Add Photos</Label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/40">
                <Input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer text-sm"
                />
                <p className="text-[11px] text-slate-500 text-center leading-snug">
                  PNG / JPG up to 5MB each. Total limit {MAX_PHOTOS} images (includes existing + new).
                </p>
              </div>
              {visibleCount >= MAX_PHOTOS && (<p className="text-xs text-amber-600">Maximum {MAX_PHOTOS} images reached.</p>)}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/admin/cars')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Car
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, XCircle, Car } from "lucide-react";
import { concurrentUpload } from "@/lib/concurrentUploads";
import { batchCompress } from "@/lib/imageCompression";
import { CAR_UPLOAD_SINGLE_MAX_MB, CAR_UPLOAD_TOTAL_MAX_MB, CAR_UPLOAD_MAX_FILES } from "@/config/uploadLimits";
import { configureAdminAuth, fetchAuthSession } from "../../../admin/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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

export default function AddCarPage() {
  const router = useRouter();
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{total:number;completed:number;success:number;failed:number;inFlight:number;currentFile?:string}|null>(null);
  const [uploading, setUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<{done:number,total:number,name:string}|null>(null);

  
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    price: "",
    // vin removed (generated on backend)
    carType: "SEDAN",
  fuelType: "GASOLINE", // Temporarily use GASOLINE until migration applies PETROL to database
    condition: "USED",
    transmission: "AUTOMATIC",
    engine: "",
    exteriorColor: "",
    // interiorColor removed per requirement
    mileage: "",
    description: "",
    dealershipId: "",
    employeeId: "",
    status: "AVAILABLE",
  featured: false,
  });

  
  interface Dealership {
    id: number;
    name: string;
    city: string;
  }
  
  interface Employee {
    id: number;
    name: string;
  }
  
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [dealershipFetchStatus, setDealershipFetchStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [dealershipFetchError, setDealershipFetchError] = useState<string>('');
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

  // Central photo cap for admin add flow (sourced from centralized config)
  const MAX_PHOTOS = CAR_UPLOAD_MAX_FILES;

  
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
        fetchEmployees();
      } catch (error) {
        console.error("Error initializing admin auth:", error);
        router.push("/admin-login");
      }
    };
    
    initAuth();
  }, [router]);

  
  const fetchDealerships = async () => {
    try {
      setDealershipFetchStatus('loading');
      setDealershipFetchError('');
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const response = await fetch('/api/dealerships', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      if (!response.ok) {
        const txt = await response.text();
        console.error('Failed to load dealerships', txt);
        setDealershipFetchStatus('error');
        setDealershipFetchError(`HTTP ${response.status}`);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length) {
        setDealerships(data);
        setFormData(prev => ({ ...prev, dealershipId: prev.dealershipId || data[0].id.toString() }));
        setDealershipFetchStatus('success');
      } else {
        console.warn('No dealerships returned');
        setDealerships([]);
        setDealershipFetchStatus('success');
      }
    } catch (error) {
      console.error("Error fetching dealerships:", error);
      setDealershipFetchStatus('error');
      setDealershipFetchError((error as Error).message);
    }
  };

  
  const fetchEmployees = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const response = await fetch('/api/employees', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      if (response.status === 401) {
        console.warn('Unauthorized fetching employees (401) – ensure user has ADMIN or SALES_MANAGER role');
        return; // suppress toast spam here
      }
      if (!response.ok) {
        const txt = await response.text();
        console.error('Failed employees fetch', response.status, txt);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setEmployees(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, employeeId: prev.employeeId || data[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
};

  

type CarType = "SEDAN" | "SUV" | "HATCHBACK" | "COUPE" | "CONVERTIBLE" | "TRUCK" | "VAN";
type FuelType = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC";
type CarCondition = "NEW" | "USED" | "CERTIFIED_PRE_OWNED" | "DEALER_DEMO";
type Transmission = "MANUAL" | "AUTOMATIC" | "CVT" | "DUAL_CLUTCH";
type CarStatus = "AVAILABLE" | "SOLD" | "RESERVED" | "MAINTENANCE";

interface CarFormData {
    make: string;
    model: string;
    year: number;
    price: string;
    vin: string; // retained in type for compatibility
    carType: CarType;
    fuelType: FuelType;
    condition: CarCondition;
    transmission: Transmission;
    engine: string;
    exteriorColor: string;
    interiorColor: string; // legacy field (not collected on create)
    mileage: string;
    description: string;
    dealershipId: string;
    employeeId: string;
    status: CarStatus;
  featured: boolean;
}

const handleSelectChange = (name: keyof CarFormData, value: string): void => {
    setFormData(prev => ({ ...prev, [name]: value }));
};

  
// Client-side limits now source from centralized config so they stay in sync with API route.
// We intentionally disable the aggregate size trimming (set effective total cap to server value or 0 to disable)
// because users reported only 16 of 25 images surviving when large originals exceeded the previous 120MB soft cap.
const MAX_SINGLE_FILE_MB = CAR_UPLOAD_SINGLE_MAX_MB; // matches server (currently 35MB)
// Use server total cap; if you want to completely disable client total enforcement set this to 0.
const MAX_TOTAL_MB = CAR_UPLOAD_TOTAL_MAX_MB; // currently 400MB (ample for 25 compressed images)

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
  if (!e.target.files) return;
  const newlySelected = Array.from(e.target.files);
  e.target.value = ''; // reset input

  // Filter invalid types & reject extremely large files (>50MB before compression)
  const valid: File[] = [];
  newlySelected.forEach(f => {
    if (!f.type.startsWith('image/')) {
      toast.error(`${f.name}: not an image – skipped`);
      return;
    }
    if (f.size / (1024 * 1024) > 50) {
      toast.error(`${f.name}: too large (>50MB) – skipped`);
      return;
    }
    valid.push(f);
  });

  if (!valid.length) return;

  // Enforce photo count limit
  if (photoFiles.length + valid.length > MAX_PHOTOS) {
    const remaining = MAX_PHOTOS - photoFiles.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} images reached.`);
      return;
    }
    toast.error(`Only adding ${remaining} of ${valid.length} photos (cap: ${MAX_PHOTOS}).`);
    valid.splice(remaining);
  }

  // Compress images client-side (WebP output, batched to prevent OOM)
  setIsCompressing(true);
  setCompressionProgress({ done: 0, total: valid.length, name: '' });
  try {
    const compressed = await batchCompress(
      valid,
      (done, total, name) => setCompressionProgress({ done, total, name }),
      { maxWidth: 1920, maxHeight: 1920, quality: 0.80 },
      3
    );

    // Post-compression size check
    for (const f of compressed) {
      const mb = f.size / (1024 * 1024);
      if (mb > MAX_SINGLE_FILE_MB) {
        toast.error(`${f.name}: ${mb.toFixed(1)}MB after compression > ${MAX_SINGLE_FILE_MB}MB – skipped`);
        continue;
      }
    }

    // Merge with existing (dedupe by name+size)
    const merged: File[] = [];
    const seen = new Set<string>();
    [...photoFiles, ...compressed].forEach(f => {
      const key = `${f.name}-${f.size}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(f);
      }
    });

    const finalList = merged.slice(0, MAX_PHOTOS);
    setPhotoFiles(finalList);

    const originalMB = valid.reduce((a, f) => a + f.size, 0) / (1024 * 1024);
    const compressedMB = compressed.reduce((a, f) => a + f.size, 0) / (1024 * 1024);
    const savings = originalMB > 0 ? ((1 - compressedMB / originalMB) * 100).toFixed(0) : '0';
    toast.success(`${compressed.length} photo(s) compressed: ${originalMB.toFixed(1)}MB → ${compressedMB.toFixed(1)}MB (${savings}% saved)`);
  } catch (err) {
    console.error('Compression error:', err);
    toast.error('Failed to compress images. Try fewer or smaller images.');
  } finally {
    setIsCompressing(false);
    setCompressionProgress(null);
  }
};

  
interface CarResponse {
    id: number;
    make: string;
    model: string;
    year: number;
    price: number;
    vin: string;
    carType: CarType;
    fuelType: FuelType;
    mileage: number;
    description: string;
    dealershipId: number;
    employeeId: number;
    status: CarStatus;
}

interface ErrorResponse {
    message: string;
}

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
    // Basic client-side validations to avoid Prisma FK errors
  // dealershipId now optional per request: only validate if provided
  const hasDealership = formData.dealershipId && !isNaN(Number(formData.dealershipId)) && Number(formData.dealershipId) > 0;
        
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString() || (typeof window !== 'undefined' ? localStorage.getItem('admin_id_token') : null) || 'admin';

        // Step 1: create car without photos
        const meta = new FormData();
        meta.append('make', formData.make);
        meta.append('model', formData.model);
        meta.append('year', String(formData.year));
        meta.append('price', formData.price || '0');
  // meta.append('vin', formData.vin); // omitted (server will generate)
        meta.append('carType', formData.carType);
  meta.append('fuelType', formData.fuelType === 'PETROL' ? 'PETROL' : formData.fuelType);
        meta.append('condition', formData.condition);
        meta.append('transmission', formData.transmission);
        meta.append('engine', formData.engine);
        meta.append('exteriorColor', formData.exteriorColor);
  // meta.append('interiorColor', formData.interiorColor); // omitted (deprecated)
        meta.append('mileage', formData.mileage || '0');
        meta.append('description', formData.description);
        meta.append('features', JSON.stringify(selectedFeatures));
        if (hasDealership) meta.append('dealershipId', formData.dealershipId);
        if (formData.employeeId) meta.append('employeeId', formData.employeeId);
        meta.append('status', formData.status);
        meta.append('featured', formData.featured ? 'true' : 'false');

        const createResp = await fetch('/api/cars', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: meta
        });
        if (!createResp.ok) {
          const raw = await createResp.text();
          let message = raw;
          try { const parsed = JSON.parse(raw); message = parsed.message || parsed.error || raw; } catch {}
          throw new Error(message.slice(0,300));
        }
        const created: CarResponse = await createResp.json();

        if (!photoFiles.length) {
          toast.success('Car added successfully!');
          router.push('/admin/cars');
          return;
        }

        // Step 2: concurrent photo uploads with retry + timeout
        setUploading(true);
        const results = await concurrentUpload(photoFiles, async (file, signal) => {
          const fdPhoto = new FormData();
          fdPhoto.append('photo', file);
          return await fetch(`/api/cars/${created.id}/photos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fdPhoto,
            signal
          });
        }, {
          concurrency: 2,
          retries: 3,
          baseDelayMs: 500,
          timeoutMs: 60_000,
          onProgress: (p) => setUploadProgress(p)
        });
        setUploading(false);
        const success = results.filter(r=>r.success).length;
        const failed = results.length - success;
        if (failed === 0) toast.success('Car and photos added successfully!');
        else if (success === 0) toast.error('Car created but all photo uploads failed. Edit later to add images.');
        else toast.warning(`${success} photos uploaded, ${failed} failed. You can add the rest via edit.` as any);
        router.push('/admin/cars');
  } catch (error) {
        console.error('Error adding car:', error);
        if (error instanceof Error) {
            toast.error(error.message || 'Failed to add car');
        } else {
            toast.error('Failed to add car');
        }
    } finally {
        setIsLoading(false);
    }
};

  
  if (!authInitialized) {
    return <FormSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add New Car
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create a new car listing in the system
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
            <CardDescription>Enter the basic information about the car</CardDescription>
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
                  step="100"  /* allow prices ending in 900 etc */
                />
                <p className="text-[11px] text-slate-500">You can enter any price (now supports amounts like 139900). Rounded to nearest Rand.</p>
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
                <Label htmlFor="fuelType">Petrol</Label>
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
              <p className="text-xs text-slate-500">Select applicable extra features. These will display on the vehicle page.</p>
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

            {/* VIN & Interior Color removed (server-generated / deprecated) */}
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
            <CardDescription>Assign this car to a dealership and employee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dealershipId">Dealership</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={fetchDealerships} disabled={dealershipFetchStatus==='loading'}>
                    {dealershipFetchStatus==='loading' ? 'Refreshing…' : 'Refresh'}
                  </Button>
                </div>
                <Select 
                  value={formData.dealershipId}
                  onValueChange={(value) => handleSelectChange("dealershipId", value)}
                  disabled={!dealerships.length}
                >
                  <SelectTrigger className={!dealerships.length ? 'opacity-60' : ''}>
                    <SelectValue placeholder={dealerships.length ? 'Select dealership' : 'No dealerships found'} />
                  </SelectTrigger>
                  <SelectContent>
                    {dealerships.length === 0 && (
                      <div className="px-3 py-2 text-xs text-slate-500">No dealerships available. Create one first.</div>
                    )}
                    {dealerships.map((dealership) => (
                      <SelectItem key={dealership.id} value={dealership.id.toString()}>
                        {dealership.name} ({dealership.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">Selected ID: {formData.dealershipId || '—'} • Loaded: {dealerships.length} • Status: {dealershipFetchStatus}{dealershipFetchError ? ` (${dealershipFetchError})` : ''}</p>
                {dealershipFetchStatus==='success' && !dealerships.length && (
                  <p className="text-[11px] text-amber-600">You must create a dealership before you can assign one to a car.</p>
                )}
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
                <span className="text-sm text-slate-600 dark:text-slate-300">Show in Featured Vehicles section</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Upload photos of the car</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photos">Car Photos</Label>
              {/* Drag & drop + click uploader */}
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fileList = e.dataTransfer.files;
                  // Create synthetic event object with target.files for reuse of handler
                  const input = document.createElement('input');
                  const dataTransfer = new DataTransfer();
                  Array.from(fileList).forEach(f => dataTransfer.items.add(f));
                  input.files = dataTransfer.files;
                  handleFileChange({ target: input } as any);
                }}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/40 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 dark:hover:border-blue-500/60 transition-colors"
                onClick={() => document.getElementById('photos')?.click()}
              >
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Drag & drop images here or click to browse</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">PNG/JPG up to {MAX_SINGLE_FILE_MB}MB each • Max {MAX_PHOTOS} images • {MAX_TOTAL_MB>0 ? `Total ≤ ${MAX_TOTAL_MB}MB` : 'No total size cap'}</p>
                <Input
                  id="photos"
                  type="file"
                  multiple={true}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">You can add up to {MAX_PHOTOS} photos. Add more later to append until the cap.</p>
              {photoFiles.length >= MAX_PHOTOS && (
                <p className="text-xs text-amber-600 mt-1">Maximum {MAX_PHOTOS} images reached.</p>
              )}
            </div>
            
            {photoFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Photos ({photoFiles.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {photoFiles.map((file, index) => (
                    <div key={index} className="relative h-20 w-20 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                      <Image 
                        src={URL.createObjectURL(file)} 
                        alt={`Preview ${index}`} 
                        width={80}
                        height={80}
                        className="h-full w-full object-cover" 
                      />
                      <button 
                        type="button"
                        onClick={() => setPhotoFiles(photoFiles.filter((_, i) => i !== index))}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            disabled={isLoading || uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Saving...
              </>
            ) : uploading && uploadProgress ? (
              <>
                <span className="animate-pulse mr-2">⬆️</span>
                Uploading {uploadProgress.completed}/{uploadProgress.total}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Car
              </>
            )}
          </Button>
        </div>
        {uploadProgress && (
          <div className="w-full bg-gray-200 h-2 rounded overflow-hidden">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }} />
          </div>
        )}
      </form>
    </div>
  );
}

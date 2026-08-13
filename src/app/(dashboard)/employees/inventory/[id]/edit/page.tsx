
"use client";

import React, { useEffect, useState as usePageState } from "react";
import { useForm as useCarForm } from "react-hook-form";
import { zodResolver as zodCarResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";


import { Form as CarFormUI } from "@/components/ui/form";
import { Button as UIButton } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import { Label as UILabel } from "@/components/ui/label";
import { Badge as UIBadge } from "@/components/ui/badge";
import {
  Dialog as UIDialog,
  DialogContent as UIDialogContent,
  DialogHeader as UIDialogHeader,
  DialogTitle as UIDialogTitle,
  DialogDescription as UIDialogDescription,
  DialogFooter as UIDialogFooter,
  DialogTrigger as UIDialogTrigger,
  DialogClose as UIDialogClose,
} from "@/components/ui/dialog";
import { Toaster, toast } from "sonner";





import {
  Car, MapPin, CheckIcon, ChevronDown, ChevronUp, Sparkles, Upload as UploadIcon, Loader2, ArrowLeft, ImageDown, XIcon, CircleDollarSign, Trash2, Edit3, PlusCircle, Gauge, Users, Fuel, Key, XCircle as XCircleIcon
} from "lucide-react"; 


import { CarFormData, carSchema } from "@/lib/schemas"; 
import { CarCondition, CarType, FuelType, Transmission, CarStatus } from "@/lib/constants"; 
import { ApiCar } from "@/lib/schemas"; 
import { useGetCarQuery, useUpdateCarMutation, useDeleteCarMutation } from "@/state/api"; 
import { batchCompress } from '@/lib/imageCompression';
import { CAR_UPLOAD_SINGLE_MAX_MB, CAR_UPLOAD_TOTAL_MAX_MB, CAR_UPLOAD_MAX_FILES } from '@/config/uploadLimits';
import { CreateFormFieldt } from "@/components/CreateFormFieldT";
import { resolveCarImageUrl } from "@/utils/imageUrl";


import { Progress } from "@/components/ui/progress";


interface FormStepProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  stepNumber: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

const FormStep = ({
  title,
  icon,
  children,
  isActive,
  isCompleted,
  stepNumber,
  totalSteps,
  onStepClick,
}: FormStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`${isActive ? 'block' : 'hidden'} w-full max-w-4xl mx-auto`}
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onStepClick && onStepClick(stepNumber)}
            role="button"
            tabIndex={0}
            aria-label={`Go to step ${stepNumber}: ${title}`}
          >
            <div 
              className={`p-2 rounded-full transition-colors ${isCompleted 
                ? 'text-green-500 bg-green-500/10 group-hover:bg-green-500/20' 
                : 'text-blue-500 bg-blue-500/10 group-hover:bg-blue-500/20'}`}
            >
              {isCompleted ? <CheckIcon size={20} /> : icon}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
              {title}
            </h2>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Step {stepNumber} of {totalSteps}
          </div>
        </div>
        <Progress 
          value={(stepNumber / totalSteps) * 100} 
          className="h-1 bg-slate-100 dark:bg-slate-800" 
        />
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </motion.div>
  );
};


interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
}

const StepNavigation = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  isSubmitting,
  isLastStep,
}: StepNavigationProps) => {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
      <UIButton
        type="button"
        variant="outline"
        onClick={onPrev}
        disabled={currentStep === 1 || isSubmitting}
        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Previous
      </UIButton>

      {isLastStep ? (
        <UIButton
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Save Changes
            </>
          )}
        </UIButton>
      ) : (
        <UIButton
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all duration-200"
        >
          Next
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </UIButton>
      )}
    </div>
  );
};

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
}

function FormSection({ title, icon, children, defaultOpen = false, actions }: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-6 last:mb-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 transition-colors">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-4">
          {actions}
          <div className="text-slate-400 dark:text-slate-500 transition-transform duration-200 transform">
            {isOpen ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-5 border-t border-slate-200 dark:border-slate-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default function EditCarPage() { 
  const router = useRouter();
  const params = useParams();
  const carIdString = params?.id as string; 
  const carIdNumber = Number(carIdString); 

  const [isOverallPageLoading, setIsOverallPageLoading] = usePageState(true);
  
  
  const [currentStep, setCurrentStep] = usePageState(1);
  const [completedSteps, setCompletedSteps] = usePageState<number[]>([]);
  const totalSteps = 4; 

  
  const [currentCarPhotos, setCurrentCarPhotos] = usePageState<string[]>([]); 
  const [newCarPhotoFiles, setNewCarPhotoFiles] = usePageState<FileList | null>(null); 
  const [carPhotosMarkedForDelete, setCarPhotosMarkedForDelete] = usePageState<string[]>([]); 
  const [replaceCarPhotosFlag, setReplaceCarPhotosFlag] = usePageState(false); 

  
  const { data: fetchedCarData, isLoading: isLoadingCar, isError: isCarError, refetch: refetchCar } = useGetCarQuery(carIdNumber, { skip: !carIdNumber || isNaN(carIdNumber) }) as { data: ApiCar | undefined, isLoading: boolean, isError: boolean, refetch: () => void }; 
  const [updateCar, { isLoading: isUpdatingCar }] = useUpdateCarMutation(); 
  const [deleteCar, { isLoading: isDeletingCar }] = useDeleteCarMutation(); 

  

  const carForm = useCarForm<CarFormData>({
    resolver: zodCarResolver(carSchema),
    defaultValues: {
  // vin retained for display only
      make: "",
      model: "",
      year: new Date().getFullYear(),
      price: 0,
      mileage: 0,
      condition: CarCondition.NEW,
      carType: CarType.SEDAN,
  fuelType: FuelType.PETROL,
      transmission: Transmission.AUTOMATIC,
      engine: "",
      exteriorColor: "",
  // interiorColor deprecated
      description: "",
      features: [],
      status: CarStatus.AVAILABLE,
      dealershipId: 1,
    },
  });

  // Normalize possible legacy API values (e.g., 'GASOLINE') to current FuelType enum
  const normalizeFuelType = (value: unknown): FuelType => {
    if (value === 'GASOLINE' || value === 'FUEL') return FuelType.PETROL;
    if (Object.values(FuelType).includes(value as FuelType)) return value as FuelType;
    return FuelType.PETROL;
  };

  useEffect(() => {
    if (fetchedCarData) {
      carForm.reset({
        carType: fetchedCarData.carType || CarType.SEDAN,
        fuelType: normalizeFuelType(fetchedCarData.fuelType),
        transmission: fetchedCarData.transmission || Transmission.AUTOMATIC,
        year: fetchedCarData.year || new Date().getFullYear(),
        price: fetchedCarData.price || 0,
        mileage: fetchedCarData.mileage || 0,
        condition: fetchedCarData.condition || CarCondition.NEW,
        engine: fetchedCarData.engine || "",
        exteriorColor: fetchedCarData.exteriorColor || "",
  // interiorColor deprecated
        description: fetchedCarData.description || "",
        features: fetchedCarData.features || [],
        status: fetchedCarData.status || CarStatus.AVAILABLE,
        dealershipId: fetchedCarData.dealershipId || 1,
        employeeId: fetchedCarData.employeeId || null,
      });
      setCurrentCarPhotos(fetchedCarData.photoUrls || []);
      setNewCarPhotoFiles(null);
      setCarPhotosMarkedForDelete([]);
      setReplaceCarPhotosFlag(false);
      setIsOverallPageLoading(false);
    }
  }, [fetchedCarData, carForm, setCurrentCarPhotos, setNewCarPhotoFiles, setCarPhotosMarkedForDelete, setReplaceCarPhotosFlag, setIsOverallPageLoading]);

  // Utility: safely parse a fetch Response as JSON or fall back to text wrapped in object
  async function safeJson(res: Response) {
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
      const text = await res.text();
      try { return JSON.parse(text); } catch { return { raw: text }; }
    } catch (e) { return { error: true, message: (e as Error).message }; }
  }

  useEffect(() => {
    if (isCarError && !isLoadingCar) {
      toast.error("Failed to load car data. It might not exist or an error occurred.");
      router.push("/employees/inventory"); 
    }
  }, [isCarError, isLoadingCar, router]);

  const handleCarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    const files = e.target.files;
    if (!files || !files.length) return;
    if (files.length > CAR_UPLOAD_MAX_FILES) {
      toast.error(`Too many photos. Limit is ${CAR_UPLOAD_MAX_FILES}.`);
      return;
    }
    // Pre-size validation
    let totalBytes = 0;
    for (const f of Array.from(files)) {
      const mb = f.size / (1024*1024);
      totalBytes += f.size;
      if (mb > CAR_UPLOAD_SINGLE_MAX_MB) {
        toast.error(`${f.name} is ${mb.toFixed(1)}MB > ${CAR_UPLOAD_SINGLE_MAX_MB}MB limit.`);
        return;
      }
    }
    if (CAR_UPLOAD_TOTAL_MAX_MB > 0 && (totalBytes / (1024*1024)) > CAR_UPLOAD_TOTAL_MAX_MB) {
      toast.error(`Selected images total exceeds ${CAR_UPLOAD_TOTAL_MAX_MB}MB limit.`);
      return;
    }
    toast.loading('Optimizing images...');
    const compressed = await batchCompress(Array.from(files), undefined, { maxWidth: 1920, maxHeight: 1920, quality: 0.82 });
    toast.dismiss();
    // Re-evaluate total size after compression
    const postBytes = compressed.reduce((a,f)=>a+f.size,0);
    if (CAR_UPLOAD_TOTAL_MAX_MB > 0 && (postBytes / (1024*1024)) > CAR_UPLOAD_TOTAL_MAX_MB) {
      toast.error(`Compressed images still exceed ${CAR_UPLOAD_TOTAL_MAX_MB}MB.`);
      return;
    }
    // Convert compressed File[] back to a FileList-like object not needed; we'll handle directly during submit
    const dt = new DataTransfer();
    compressed.forEach(f=>dt.items.add(f));
    setNewCarPhotoFiles(dt.files);
  };

  const toggleCarPhotoForDelete = (url: string) => { 
    setCarPhotosMarkedForDelete(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const onSubmitCarHandler = async (data: CarFormData) => { 
    
    toast.loading("Updating car...");
    
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key === "features") {
            if (Array.isArray(value) && value.length > 0) formData.append(key, value.join(','));
        } else if (typeof value === 'boolean') {
            formData.append(key, String(value));
        } else if (value !== null && value !== undefined && value !== '') {
            formData.append(key, String(value));
        }
    });

  // For update we send ONLY metadata first (no new photos) to avoid large multipart
  // New photos will be uploaded sequentially afterward via /api/cars/:id/photos
    formData.append("replacePhotos", String(replaceCarPhotosFlag));

    
    if (!replaceCarPhotosFlag && carPhotosMarkedForDelete.length > 0) {
        const keptPhotoUrls = currentCarPhotos.filter(url => !carPhotosMarkedForDelete.includes(url));
        formData.append('photoUrls', JSON.stringify(keptPhotoUrls));
        console.log('Images kept:', keptPhotoUrls);
        console.log('Images to delete:', carPhotosMarkedForDelete);
    }

    try {
      await updateCar({ id: carIdString, carData: formData as any }).unwrap();
      // Sequentially upload any new photos
      let success = 0; let failed = 0; const list = newCarPhotoFiles ? Array.from(newCarPhotoFiles) : [];
      if (list.length) {
        toast.message(`Uploading 0/${list.length} photos...`);
        for (let i=0;i<list.length;i++) {
          const f = list[i];
          // size validation again (defensive)
            const mb = f.size/(1024*1024);
            if (mb > CAR_UPLOAD_SINGLE_MAX_MB) { failed++; continue; }
          const fdP = new FormData(); fdP.append('photo', f);
          try {
            const r = await fetch(`/api/cars/${carIdString}/photos`, { method:'POST', body: fdP });
            if (r.ok) success++; else failed++;
          } catch { failed++; }
          toast.message(`Uploading ${i+1}/${list.length} photos...`, { description: `${success} ok / ${failed} failed` });
        }
      }
      toast.dismiss();
      if (failed === 0) toast.success(list.length ? 'Car & photos updated.' : 'Car updated successfully!');
      else if (success === 0) toast.error('Car updated, but photo uploads failed. Retry later.');
      else toast.warning(`${success} photos uploaded, ${failed} failed.` as any);
      await refetchCar();
      setNewCarPhotoFiles(null); setCarPhotosMarkedForDelete([]);
    } catch (error: any) {
      toast.dismiss();
      const status = error?.status || error?.originalStatus || error?.data?.status;
      if (status === 413) {
        toast.error('Upload too large. Try fewer or smaller images.');
      } else {
        toast.error(error?.data?.message || 'Failed to update car.');
      }
      console.error('Error updating car:', error);
    }
  };

  const handleDeleteCar = async () => { 
    try {
      await deleteCar(carIdString).unwrap(); 
      toast.success("Car deleted successfully!");
      router.push("/employees/inventory"); 
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete car.");
    }
  };

  

  if (isOverallPageLoading || isLoadingCar) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background dark:bg-gray-900 p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <p className="text-xl text-muted-foreground dark:text-gray-400">Loading...</p> 
      </div>
    );
  }

  if (isCarError || !fetchedCarData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background dark:bg-gray-900 p-6 text-center">
        <XCircleIcon className="h-20 w-20 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold text-destructive mb-3">Error Loading Car</h2> 
        <p className="text-lg text-muted-foreground dark:text-gray-400 mb-8">
          The car data could not be loaded. It might have been deleted, or an unexpected error occurred.
        </p>
        <UIButton onClick={() => router.push("/employees/inventory")} variant="outline" size="lg"> 
          <ArrowLeft className="mr-2 h-5 w-5" /> Go Back to Inventory
        </UIButton>
      </div>
    );
  }

  const isAnyMutationLoading = isUpdatingCar || isDeletingCar; 

  return (
    <div className="min-h-screen dark:text-slate-800 text-white">
      <Toaster richColors position="top-center" />
      <div className="relative container mx-auto px-4 py-8 mb-20">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
       
        
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UIButton variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => router.back()}>
              <ArrowLeft size={20} />
            </UIButton>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">Edit Car</h1> 
              <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 truncate max-w-md">
                {`${fetchedCarData?.year} ${fetchedCarData?.make} ${fetchedCarData?.model}` || "Loading name..."} 
              </p>
            </div>
          </div>
          <UIDialog>
            <UIDialogTrigger asChild>
              <UIButton variant="destructive" disabled={isAnyMutationLoading} className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Car 
              </UIButton>
            </UIDialogTrigger>
            <UIDialogContent className="dark:bg-gray-800 dark:border-gray-700">
              <UIDialogHeader>
                <UIDialogTitle className="dark:text-gray-100">Are you absolutely sure?</UIDialogTitle>
                <UIDialogDescription className="dark:text-gray-400">
                  This action cannot be undone. This will permanently delete the car
                  and all its associated data, including photos from the database and S3.
                </UIDialogDescription>
              </UIDialogHeader>
              <UIDialogFooter className="mt-4">
                <UIDialogClose asChild><UIButton variant="outline">Cancel</UIButton></UIDialogClose>
                <UIButton variant="destructive" onClick={handleDeleteCar} disabled={isDeletingCar}>
                  {isDeletingCar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Yes, delete car 
                </UIButton>
              </UIDialogFooter>
            </UIDialogContent>
          </UIDialog>
        </div>

        
        <CarFormUI {...carForm}> 
          <form onSubmit={carForm.handleSubmit(onSubmitCarHandler)} className="space-y-8"> 
            
            <FormSection title="Basic Information" icon={<Car size={20} />} defaultOpen={true}> 
              <div className="space-y-6">
                <p className="text-xs text-slate-500 dark:text-slate-400">VIN: <span className="font-mono">{fetchedCarData?.vin || '—'}</span></p>
                <CreateFormFieldt name="make" label="Make" control={carForm.control} placeholder="e.g., Toyota" />
                <CreateFormFieldt name="model" label="Model" control={carForm.control} placeholder="e.g., Camry" />
                <CreateFormFieldt name="year" label="Year" type="number" control={carForm.control} placeholder="e.g., 2023" />
                <CreateFormFieldt name="price" label="Price" type="number" control={carForm.control} placeholder="e.g., 25000" />
                <CreateFormFieldt name="mileage" label="Mileage (km)" type="number" control={carForm.control} placeholder="e.g., 50000" />
              </div>
            </FormSection>

            
             <FormSection title="Car Details" icon={<Sparkles size={20} />}> 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <CreateFormFieldt name="condition" label="Condition" type="select" control={carForm.control} options={Object.values(CarCondition).map(cond => ({ value: cond, label: cond.replace(/_/g, ' ') }))} />
                <CreateFormFieldt name="carType" label="Car Type" type="select" control={carForm.control} options={Object.values(CarType).map(type => ({ value: type, label: type.replace(/_/g, ' ') }))} />
                <CreateFormFieldt name="fuelType" label="Fuel Type" type="select" control={carForm.control} options={Object.values(FuelType).map(type => ({ value: type, label: type.replace(/_/g, ' ') }))} />
                <CreateFormFieldt name="transmission" label="Transmission" type="select" control={carForm.control} options={Object.values(Transmission).map(trans => ({ value: trans, label: trans.replace(/_/g, ' ') }))} />
                <CreateFormFieldt name="engine" label="Engine (Optional)" control={carForm.control} placeholder="e.g., 2.0L Turbo" />
                <CreateFormFieldt name="exteriorColor" label="Exterior Color (Optional)" control={carForm.control} placeholder="e.g., Blue" />
                {/* interiorColor removed */}
              </div>
              <CreateFormFieldt name="description" label="Description" type="textarea" control={carForm.control} placeholder="Provide a detailed description of the car..." inputClassName="min-h-[150px]" />
            </FormSection>

            
            <FormSection title="Features & Photos" icon={<ImageDown size={20} />}> 
              <div className="space-y-6">
                <CreateFormFieldt name="features" label="Features (comma-separated)" control={carForm.control} placeholder="e.g., Bluetooth, Sunroof, Navigation" />
                <div>
                    <UILabel htmlFor="carPhotosFile" className="block text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1.5">Upload New Photos</UILabel>
                    <UIInput id="carPhotosFile" type="file" multiple onChange={handleCarFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:file:bg-primary/30 dark:file:text-primary-foreground dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"/>
                    <div className="mt-3 flex items-center space-x-2">
                        <UICheckbox id="replaceCarPhotosFlag" checked={replaceCarPhotosFlag} onCheckedChange={(checked) => setReplaceCarPhotosFlag(Boolean(checked))} className="dark:border-gray-600 dark:data-[state=checked]:bg-primary" />
                        <UILabel htmlFor="replaceCarPhotosFlag" className="text-xs font-normal text-muted-foreground dark:text-gray-400">Replace all existing photos with new uploads</UILabel>
                    </div>
                     <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                        If &quot;Replace all&quot; is unchecked, new photos will be added. To remove specific old photos without replacing all, your backend needs to support selective deletion via an update. Otherwise, only &quot;Replace all&quot; or deleting the entire car will remove old photos from S3.
                    </p>
                </div>

                {newCarPhotoFiles && Array.from(newCarPhotoFiles).length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2">New photos preview ({Array.from(newCarPhotoFiles).length}):</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {Array.from(newCarPhotoFiles).map((file, index) => (
                            <div key={index} className="relative aspect-video bg-muted dark:bg-gray-700 rounded-md overflow-hidden shadow">
                                <Image src={URL.createObjectURL(file)} alt={`New Car Preview ${index}`} layout="fill" objectFit="cover" />
                            </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentCarPhotos.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-2">Current Photos ({currentCarPhotos.length}):</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {currentCarPhotos.map((url, index) => (
                            <div key={url} className="relative aspect-video bg-muted dark:bg-gray-700 rounded-md group overflow-hidden shadow">
                                <Image src={resolveCarImageUrl(url)} alt={`Car Photo ${index + 1}`} layout="fill" objectFit="cover" unoptimized />
                                <UIButton type="button" variant="secondary" size="icon"
                                    onClick={() => toggleCarPhotoForDelete(url)}
                                    className={`absolute top-1.5 right-1.5 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-150
                                                ${carPhotosMarkedForDelete.includes(url) ? '!opacity-100 bg-green-500 hover:bg-green-600 text-white' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}`}>
                                    {carPhotosMarkedForDelete.includes(url) ? <CheckIcon size={16} /> : <Trash2 size={16} />}
                                </UIButton>
                                {carPhotosMarkedForDelete.includes(url) && <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md"><UIBadge variant="destructive">Marked</UIBadge></div>}
                            </div>
                            ))}
                        </div>
                        {carPhotosMarkedForDelete.length > 0 && !replaceCarPhotosFlag && (
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                                ({carPhotosMarkedForDelete.length}) photo(s) marked. Actual removal if not &quot;Replacing all&quot; depends on backend update logic.
                            </p>
                        )}
                    </div>
                )}
                 {currentCarPhotos.length === 0 && (!newCarPhotoFiles || Array.from(newCarPhotoFiles).length === 0) && (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">No photos uploaded for this car yet.</p>
                 )}
              </div>
            </FormSection>

            
            <FormSection title="Dealership Information" icon={<MapPin size={20} />}> 
              <div className="space-y-6">
                <CreateFormFieldt name="dealershipId" label="Dealership ID" type="number" control={carForm.control} placeholder="Enter Dealership ID" />
              </div>
            </FormSection>

            

            
            <div className="sticky bottom-0">
              <div className="max-w-6xl mx-auto flex justify-end px-4">
                <UIButton 
                  type="submit" 
                  size="lg" 
                  className="min-w-[200px] text-base mt-5 bg-blue-600 backdrop-blur-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm hover:shadow-md transition-all duration-300 font-medium rounded-lg" 
                  disabled={isAnyMutationLoading}
                >
                  {isUpdatingCar && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Save All Car Changes 
                </UIButton>
              </div>
            </div>
          </form>
        </CarFormUI>

        
      </div>
    </div>
  );
}

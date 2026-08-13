import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";


export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      
      
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-sm" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      
      <div className="border rounded-lg">
        
        <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted/50">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}


export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[60px] mb-2" />
        <Skeleton className="h-3 w-[120px]" />
      </CardContent>
    </Card>
  );
}


export function CarCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export function DetailPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-8 w-[300px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>

        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[120px]" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[100px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-[80px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </div>
  );
}

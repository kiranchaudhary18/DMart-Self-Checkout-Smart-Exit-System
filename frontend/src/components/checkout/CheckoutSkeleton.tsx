import { Skeleton } from "@/components/ui/skeleton";

export function CheckoutSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Skeleton className="h-6 w-1/3 mb-6" />
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-5 w-16 ml-auto" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Skeleton className="h-6 w-1/2 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4">
              <Skeleton className="h-6 w-full" />
            </div>
            <Skeleton className="h-12 w-full mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

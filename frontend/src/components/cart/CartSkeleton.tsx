import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8">
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg shrink-0" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between items-end mt-4">
                  <Skeleton className="h-10 w-24 rounded-lg" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="lg:col-span-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-12 w-full mt-4 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

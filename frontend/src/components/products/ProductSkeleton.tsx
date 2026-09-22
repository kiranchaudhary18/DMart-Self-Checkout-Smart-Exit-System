import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProductSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-slate-200 shadow-sm bg-white">
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full bg-slate-100 animate-pulse"></div>

      <CardHeader className="p-4 pb-0 flex-none space-y-2">
        <div className="flex justify-between items-start">
          <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-3 w-12 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-5 w-1/2 bg-slate-200 rounded animate-pulse"></div>
      </CardHeader>

      <CardContent className="p-4 flex-grow flex flex-col justify-end">
        <div className="h-6 w-20 bg-slate-200 rounded animate-pulse mb-2"></div>
        <div className="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
      </CardContent>

      <div className="flex p-4 pt-0 gap-2">
        <div className="flex-1 h-10 bg-slate-200 rounded animate-pulse"></div>
        <div className="flex-1 h-10 bg-slate-200 rounded animate-pulse"></div>
      </div>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

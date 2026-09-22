import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  sortOrder: "newest" | "oldest";
  onSortChange: (val: "newest" | "oldest") => void;
}

export function OrderFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortOrder,
  onSortChange,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <Input
          type="text"
          placeholder="Search by Order ID..."
          className="pl-10 h-10 w-full"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <select 
          className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-[160px]"
          value={statusFilter} 
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select 
          className="h-10 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-[140px]"
          value={sortOrder} 
          onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
}

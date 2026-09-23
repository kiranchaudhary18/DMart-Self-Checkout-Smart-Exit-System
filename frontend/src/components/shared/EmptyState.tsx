import React from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon = SearchX, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = "" 
}: EmptyStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      aria-live="polite"
    >
      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-100" aria-hidden="true">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6 text-sm">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" className="min-w-[120px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

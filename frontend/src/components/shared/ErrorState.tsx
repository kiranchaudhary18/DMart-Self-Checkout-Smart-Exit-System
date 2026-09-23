import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "An unexpected error occurred while loading this content.", 
  onRetry,
  className = ""
}: ErrorStateProps) {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-100" aria-hidden="true">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6 text-sm">{message}</p>
      
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="min-w-[120px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

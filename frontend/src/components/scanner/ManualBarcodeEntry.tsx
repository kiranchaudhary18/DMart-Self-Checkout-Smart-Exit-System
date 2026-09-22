"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ManualBarcodeEntryProps {
  onSearch: (barcode: string) => void;
  isLoading?: boolean;
}

export function ManualBarcodeEntry({ onSearch, isLoading = false }: ManualBarcodeEntryProps) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const trimmed = barcode.trim();
    if (!trimmed) {
      setError("Please enter a barcode number.");
      return;
    }
    
    if (trimmed.length < 3) {
      setError("Barcode is too short.");
      return;
    }
    
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto mt-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="manual-barcode" className="text-sm font-medium text-slate-700">
          Enter barcode manually
        </label>
        
        <div className="flex gap-2">
          <Input
            id="manual-barcode"
            type="text"
            placeholder="e.g. 8901234567890"
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
              if (error) setError(null);
            }}
            disabled={isLoading}
            className="flex-1 bg-white"
            autoComplete="off"
            inputMode="numeric"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !barcode.trim()} 
            className="bg-slate-900 hover:bg-slate-800 text-white shrink-0"
          >
            <Search className="h-4 w-4 mr-2" />
            Find Product
          </Button>
        </div>
        
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    </form>
  );
}

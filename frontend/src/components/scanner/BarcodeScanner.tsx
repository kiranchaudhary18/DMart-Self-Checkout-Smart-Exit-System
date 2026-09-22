"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Result } from "@zxing/library";
import { Camera, CameraOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onManualEntryRequested?: () => void;
}

export function BarcodeScanner({ onScan, onManualEntryRequested }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastScannedRef = useRef<number>(0);
  const [controls, setControls] = useState<IScannerControls | null>(null);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScanning = async () => {
    setIsInitializing(true);
    setError(null);
    setScannedCode(null);
    
    try {
      // Prompt for camera permissions explicitly first if we haven't already
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setHasPermission(true);
      
      const reader = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        const scannerControls = await reader.decodeFromVideoElement(videoRef.current, (result: Result | undefined, err, controls) => {
          if (result && !scannedCode) {
            const now = Date.now();
            if (now - lastScannedRef.current < 2000) return; // 2 second cooldown
            
            const barcodeText = result.getText();
            lastScannedRef.current = now;
            setScannedCode(barcodeText);
            controls.stop();
            setIsScanning(false);
            
            // Provide subtle vibration feedback if supported by browser
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(200);
            }
            
            // Wait a brief moment so the user sees the success state, then callback
            setTimeout(() => {
              onScan(barcodeText);
            }, 800);
          }
        });
        
        setControls(scannerControls);
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setHasPermission(false);
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("An error occurred while accessing the camera. Please try again.");
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Initial start
    startScanning();

    // Cleanup on unmount
    return () => {
      if (controls) {
        controls.stop();
      }
    };
  }, []); // Run only once on mount

  const handleRetry = () => {
    if (controls) controls.stop();
    setHasPermission(null);
    startScanning();
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-200 min-h-[300px] text-center">
        <CameraOff className="h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Camera Access Denied</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          Camera access is required to scan products. Please enable it in your browser settings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button variant="outline" className="w-full" onClick={handleRetry}>
            Try Again
          </Button>
          {onManualEntryRequested && (
            <Button variant="primary" className="w-full bg-primary-600 hover:bg-primary-700 text-white" onClick={onManualEntryRequested}>
              Enter Manually
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border border-red-100 min-h-[300px] text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Error</h3>
        <p className="text-sm text-red-600 mb-6 max-w-xs">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-100" onClick={handleRetry}>
            Try Again
          </Button>
          {onManualEntryRequested && (
            <Button variant="primary" className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={onManualEntryRequested}>
              Enter Manually
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[3/4] sm:aspect-square bg-slate-900 rounded-xl overflow-hidden shadow-lg border-2 border-slate-800">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 text-white backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
          <p className="font-medium">Requesting camera access...</p>
        </div>
      )}

      {/* Scanning Target Overlay */}
      {isScanning && !scannedCode && !isInitializing && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
          {/* Darkened outer area */}
          <div className="absolute inset-0 border-[60px] sm:border-[80px] border-black/40"></div>
          
          {/* Clear targeting box */}
          <div className="relative w-full max-w-[280px] aspect-[4/3] border-2 border-white/50 rounded-lg">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg -mb-1 -mr-1"></div>
            
            {/* Animated scanning line (requires custom tailwind class or inline style) */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes scan {
                0% { transform: translateY(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(200px); opacity: 0; }
              }
              .animate-scan {
                animation: scan 2.5s ease-in-out infinite;
              }
            `}} />
            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] animate-scan"></div>
          </div>
          <p className="absolute bottom-8 text-white/90 text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md">
            Align barcode within the frame
          </p>
        </div>
      )}

      {/* Success Overlay */}
      {scannedCode && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-green-500/90 text-white backdrop-blur-sm animate-in fade-in duration-300">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4">
            <Camera className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-1">Barcode Detected</h3>
          <p className="font-mono bg-white/20 px-3 py-1 rounded-md text-lg">{scannedCode}</p>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SecurityDashboardLayout } from "@/components/layout/SecurityDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ScanBarcode, 
  Camera, 
  CameraOff,
  SwitchCamera,
  Keyboard,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldX,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

type VerificationStatus = 'IDLE' | 'VERIFYING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'INVALID' | 'SUSPICIOUS' | 'ALREADY_USED' | 'PENDING' | 'ERROR';

export default function SecurityScanPage() {
  const router = useRouter();
  
  // Camera & Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Input State
  const [manualInput, setManualInput] = useState("");
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  
  // Verification State
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('IDLE');
  const [scannedData, setScannedData] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    // Initialize ZXing reader
    codeReaderRef.current = new BrowserMultiFormatReader();
    
    // Get available cameras
    codeReaderRef.current.listVideoInputDevices()
      .then(videoInputDevices => {
        setDevices(videoInputDevices);
        if (videoInputDevices.length > 0) {
          // Default to the last camera (often the back camera on mobile)
          setSelectedDeviceId(videoInputDevices[videoInputDevices.length - 1].deviceId);
          setHasCameraPermission(true);
        } else {
          setHasCameraPermission(false);
          setScanError("No camera devices found.");
        }
      })
      .catch(err => {
        console.error("Camera access error:", err);
        setHasCameraPermission(false);
        setScanError("Camera access denied or unavailable.");
      });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = () => {
    if (!videoRef.current || !codeReaderRef.current) return;
    
    setScanError(null);
    setIsScanning(true);
    setVerificationStatus('IDLE');
    setScannedData(null);
    
    codeReaderRef.current.decodeFromVideoDevice(
      selectedDeviceId || undefined, 
      videoRef.current, 
      (result, err) => {
        if (result) {
          handleScanSuccess(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error("Scan error:", err);
        }
      }
    ).catch(err => {
      console.error("Start scanning error:", err);
      setScanError("Failed to start camera.");
      setIsScanning(false);
    });
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const switchCamera = () => {
    if (devices.length < 2) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    
    stopScanning();
    setSelectedDeviceId(devices[nextIndex].deviceId);
    
    // Slight delay to allow reset before restarting
    setTimeout(() => startScanning(), 300);
  };

  const [verificationResult, setVerificationResult] = useState<{
    message?: string;
    orderNumber?: string;
    reason?: string;
    time?: string;
  } | null>(null);

  const handleScanSuccess = (data: string) => {
    stopScanning();
    setScannedData(data);
    setVerificationStatus('PENDING'); // Show review state
    setVerificationResult(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    setScannedData(manualInput.trim());
    setVerificationStatus('PENDING');
    setVerificationResult(null);
  };

  const handleVerification = async () => {
    if (!scannedData || verificationStatus === 'VERIFYING') return;
    
    setVerificationStatus('VERIFYING');
    setVerificationResult(null);
    
    try {
      const { verifyExitQR } = await import('@/lib/api/securityVerification');
      const response = await verifyExitQR(scannedData);
      
      setVerificationResult({
        message: response.message,
        orderNumber: response.order_number,
        reason: response.reason,
        time: response.verified_at
      });

      if (response.status === 'allowed') {
        setVerificationStatus('VERIFIED');
      } else {
        // Map rejection reason to UI state
        switch (response.reason) {
          case 'TOKEN_EXPIRED':
            setVerificationStatus('EXPIRED');
            break;
          case 'TOKEN_ALREADY_USED':
            setVerificationStatus('ALREADY_USED');
            break;
          case 'INVALID_TOKEN':
          case 'INVALID_QR_FORMAT':
          case 'TOKEN_REVOKED':
            setVerificationStatus('INVALID');
            break;
          case 'ORDER_NOT_FOUND':
          case 'PAYMENT_NOT_COMPLETED':
          case 'ORDER_MISMATCH':
          case 'UNAUTHORIZED':
            setVerificationStatus('SUSPICIOUS');
            break;
          default:
            setVerificationStatus('REJECTED');
        }
      }
    } catch (err) {
      // Intentionally not logging full error to avoid token leak
      console.error("Verification error occurred.");
      setVerificationStatus('ERROR');
      setVerificationResult({
        message: "An unexpected error occurred during verification."
      });
    }
  };

  const resetScanner = () => {
    setVerificationStatus('IDLE');
    setScannedData(null);
    setManualInput("");
    setVerificationResult(null);
    if (mode === 'camera') {
      startScanning();
    }
  };

  const renderResultState = () => {
    switch (verificationStatus) {
      case 'VERIFYING':
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
            <h3 className="text-lg font-medium text-slate-900">Verifying Exit Pass...</h3>
            <p className="text-slate-500 text-sm">Please wait while we securely verify this pass.</p>
          </div>
        );
      
      case 'VERIFIED':
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-700">Exit Verified</h3>
            <p className="text-green-800/80 font-medium bg-green-50 px-4 py-2 rounded-full text-sm">
              {verificationResult?.message || "Customer is clear to exit."}
            </p>
            {verificationResult?.orderNumber && (
              <div className="mt-2 text-sm text-slate-600">
                Order: <span className="font-mono">{verificationResult.orderNumber}</span>
              </div>
            )}
            {verificationResult?.time && (
              <div className="text-xs text-slate-500">
                Verified at: {new Date(verificationResult.time).toLocaleTimeString()}
              </div>
            )}
            <Button onClick={resetScanner} className="mt-6 w-full max-w-xs bg-slate-900 hover:bg-slate-800">
              Scan Next Pass
            </Button>
          </div>
        );
        
      case 'REJECTED':
      case 'INVALID':
      case 'ERROR':
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <ShieldX className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-red-700">Access Denied</h3>
            <p className="text-red-800/80 font-medium bg-red-50 px-4 py-2 rounded-full text-sm">
              {verificationResult?.message || "Invalid or rejected exit pass."}
            </p>
            {verificationResult?.reason && (
              <div className="mt-2 text-sm text-red-600 font-mono bg-red-50/50 px-2 py-1 rounded">
                Reason: {verificationResult.reason}
              </div>
            )}
            <Button onClick={resetScanner} variant="outline" className="mt-6 w-full max-w-xs">
              Try Again
            </Button>
          </div>
        );
        
      case 'EXPIRED':
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-2">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-amber-700">Pass Expired</h3>
            <p className="text-amber-800/80 font-medium bg-amber-50 px-4 py-2 rounded-full text-sm">
              {verificationResult?.message || "This exit pass has expired."}
            </p>
            <Button onClick={resetScanner} variant="outline" className="mt-6 w-full max-w-xs">
              Scan Different Pass
            </Button>
          </div>
        );
        
      case 'SUSPICIOUS':
      case 'ALREADY_USED':
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-700">Action Required</h3>
            <p className="text-orange-800/80 font-medium bg-orange-50 px-4 py-2 rounded-full text-sm">
              {verificationResult?.message || (verificationStatus === 'ALREADY_USED' ? 'This pass has already been used.' : 'Suspicious activity detected.')}
            </p>
            <p className="mt-2 text-sm font-medium text-orange-700">Please follow store verification procedure.</p>
            <Button onClick={resetScanner} variant="outline" className="mt-6 w-full max-w-xs border-orange-200 text-orange-700 hover:bg-orange-50">
              Scan Another Pass
            </Button>
          </div>
        );

      case 'PENDING':
        return (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <ScanBarcode className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Pass Captured</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                Review the capture and proceed with verification.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mt-4">
              <Button onClick={resetScanner} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleVerification} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Verify Exit
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute allowedRoles={["SECURITY", "ADMIN"]}>
      <SecurityDashboardLayout>
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/security/dashboard')}
              className="px-2 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Scan Exit QR</h1>
              <p className="text-slate-500 text-sm mt-1">Verify customer exit passes securely.</p>
            </div>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            {/* Mode Switcher Tabs */}
            {verificationStatus === 'IDLE' && (
              <div className="flex border-b border-slate-100">
                <button
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === 'camera' ? 'bg-white text-slate-900 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-b-2 border-transparent'}`}
                  onClick={() => {
                    setMode('camera');
                    setManualInput("");
                  }}
                >
                  <Camera className="w-4 h-4" /> Camera Scanner
                </button>
                <button
                  className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === 'manual' ? 'bg-white text-slate-900 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-b-2 border-transparent'}`}
                  onClick={() => {
                    setMode('manual');
                    stopScanning();
                  }}
                >
                  <Keyboard className="w-4 h-4" /> Manual Entry
                </button>
              </div>
            )}

            <CardContent className="p-0">
              {verificationStatus !== 'IDLE' ? (
                renderResultState()
              ) : mode === 'camera' ? (
                <div className="relative bg-slate-950 aspect-[4/3] md:aspect-video flex flex-col items-center justify-center">
                  
                  {/* Camera Video Element */}
                  <video 
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Overlay Frame */}
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="w-full h-full border-[40px] md:border-[80px] border-black/40"></div>
                    {/* Targeting Box */}
                    <div className="absolute inset-0 m-auto w-48 h-48 md:w-64 md:h-64 border-2 border-blue-500/50 flex flex-col justify-between">
                      <div className="w-full flex justify-between">
                        <div className="w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                        <div className="w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                      </div>
                      {isScanning && (
                        <div className="w-full h-0.5 bg-blue-500/50 animate-pulse absolute top-1/2 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                      )}
                      <div className="w-full flex justify-between">
                        <div className="w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                        <div className="w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                      </div>
                    </div>
                  </div>

                  {/* UI Controls overlay */}
                  <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="bg-black/60 text-white border-white/20 backdrop-blur-sm">
                        {isScanning ? (
                          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div> Scanning</span>
                        ) : 'Camera Ready'}
                      </Badge>
                      
                      {devices.length > 1 && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={switchCamera}
                          className="px-2 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-center mt-auto pb-4">
                      {hasCameraPermission === false && (
                        <div className="bg-black/80 text-white p-4 rounded-lg backdrop-blur-sm max-w-xs mx-auto mb-4 border border-white/10">
                          <CameraOff className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-sm font-medium">{scanError || "Camera access denied."}</p>
                          <p className="text-xs text-slate-400 mt-1">Please enable permissions in your browser settings.</p>
                        </div>
                      )}
                      
                      {hasCameraPermission !== false && (
                        <p className="text-white/90 text-sm font-medium bg-black/40 inline-block px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
                          Ask the customer to display their Exit QR clearly and scan it inside the frame.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 py-12">
                  <form onSubmit={handleManualSubmit} className="max-w-md mx-auto space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <Keyboard className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Manual Entry</h3>
                      <p className="text-sm text-slate-500">
                        Enter the Order Number from the customer's receipt (e.g. DMART-...)
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <Input
                        type="text"
                        placeholder="e.g. DMART-XXXXXX"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                        className="text-center font-mono text-lg py-6 uppercase tracking-wider"
                      />
                      <Button 
                        type="submit" 
                        disabled={!manualInput.trim()}
                        className="w-full bg-slate-900 hover:bg-slate-800"
                      >
                        Verify Order
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
            
            {verificationStatus === 'IDLE' && mode === 'camera' && hasCameraPermission !== false && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center rounded-b-lg">
                <Button 
                  onClick={toggleScanning}
                  variant={isScanning ? "danger" : "primary"}
                  className={`w-full max-w-sm rounded-full py-6 font-semibold text-base ${!isScanning ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                >
                  {isScanning ? (
                    <span className="flex items-center gap-2"><CameraOff className="w-5 h-5" /> Stop Scanner</span>
                  ) : (
                    <span className="flex items-center gap-2"><Camera className="w-5 h-5" /> Start Scanner</span>
                  )}
                </Button>
              </div>
            )}
          </Card>

        </div>
      </SecurityDashboardLayout>
    </ProtectedRoute>
  );
}


import React, { useRef, useState } from "react";
import { detectMalnutrition } from "../../services/gemini";
import { Camera, RefreshCw, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

interface VisionScanProps {
  onScanComplete: (result: any) => void;
}

export default function VisionScan({ onScanComplete }: VisionScanProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await detectMalnutrition(capturedImage);
      setScanResult(result);
    } catch (error) {
      console.error("Vision analysis failed:", error);
      alert("Vision analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setScanResult(null);
    startCamera();
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Malnutrition Vision Scan</h2>
        <Camera className="w-6 h-6 text-emerald-500" />
      </div>

      <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
        {!isCameraActive && !capturedImage && (
          <button
            onClick={startCamera}
            className="flex flex-col items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <Camera className="w-12 h-12" />
            <span className="font-medium">Start Camera</span>
          </button>
        )}

        {isCameraActive && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <button
              onClick={captureImage}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-emerald-500 shadow-lg flex items-center justify-center"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-full" />
            </button>
          </>
        )}

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {capturedImage && !scanResult && (
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Retake
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Scan"
            )}
          </button>
        </div>
      )}

      {scanResult && (
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Vision Scan Results</h3>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold uppercase",
              scanResult.status === "severe" ? "bg-red-100 text-red-600" :
              scanResult.status === "at_risk" ? "bg-orange-100 text-orange-600" :
              "bg-emerald-100 text-emerald-600"
            )}>
              {scanResult.status === "severe" ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {scanResult.status.replace("_", " ")}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Confidence Score</span>
              <span>{(scanResult.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${scanResult.confidence * 100}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100 italic">
            "{scanResult.notes}"
          </p>

          <button
            onClick={() => onScanComplete(scanResult)}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Apply to Report
          </button>
        </div>
      )}
    </div>
  );
}

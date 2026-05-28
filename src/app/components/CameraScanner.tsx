"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

interface CameraScannerProps {
  isOpen: boolean;
  onScan: (value: string) => Promise<boolean>;
  onClose: () => void;
}

export default function CameraScanner({ isOpen, onScan, onClose }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    setScanError(null);
    setCameraReady(false);
    activeRef.current = true;

    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromConstraints(
        { video: { facingMode } },
        videoEl,
        async (result, err) => {
          if (!activeRef.current) return;
          if (result) {
            const success = await onScan(result.getText());
            if (success) {
              onClose();
            } else {
              setScanError("Pieza no encontrada. Intentá de nuevo.");
            }
          } else if (err && !err.message?.includes("No MultiFormat")) {
            // ignore continuous decode-loop "not found" errors
          }
        },
      )
      .then((controls) => {
        if (!activeRef.current) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setCameraReady(true);
      })
      .catch(() => {
        setScanError("No se pudo acceder a la cámara. Verificá los permisos.");
      });

    return () => {
      activeRef.current = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (videoEl) videoEl.srcObject = null;
      setCameraReady(false);
    };
  }, [isOpen, facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFlip = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setScanError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {/* Scan area frame */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative h-56 w-4/5 max-w-xs">
            <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-white rounded-tl-sm" />
            <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-white rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white rounded-br-sm" />
          </div>
          {!cameraReady && !scanError && (
            <p className="mt-4 text-sm text-white/80">Iniciando cámara...</p>
          )}
          {cameraReady && (
            <p className="mt-4 text-sm text-white/80">Apuntá el código al recuadro</p>
          )}
        </div>

        {/* Top controls */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-4">
          <button
            onClick={handleFlip}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            aria-label="Cambiar cámara"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" />
              <path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            aria-label="Cerrar scanner"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error zone */}
      {scanError && (
        <div className="bg-black px-4 py-3 text-center text-sm text-red-400">
          {scanError}
        </div>
      )}
    </div>
  );
}

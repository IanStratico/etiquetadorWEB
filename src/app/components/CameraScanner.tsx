"use client";

import { useEffect, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const CONTAINER_ID = "camera-scanner-feed";

interface CameraScannerProps {
  isOpen: boolean;
  onScan: (value: string) => Promise<boolean>;
  onClose: () => void;
}

export default function CameraScanner({ isOpen, onScan, onClose }: CameraScannerProps) {
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    let processing = false;
    setScanError(null);
    setCameraReady(false);
    setIsProcessing(false);

    const scanner = new Html5Qrcode(CONTAINER_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });

    scanner
      .start(
        { facingMode },
        {
          fps: 15,
          videoConstraints: {
            facingMode,
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
          },
        },
        async (decodedText) => {
          if (cancelled || processing) return;
          processing = true;
          setIsProcessing(true);
          const success = await onScan(decodedText);
          if (success) {
            onClose();
          } else {
            setScanError("Pieza no encontrada. Intentá de nuevo.");
            processing = false;
            setIsProcessing(false);
          }
        },
        () => { /* error por frame — ignorar */ },
      )
      .then(() => {
        if (!cancelled) setCameraReady(true);
      })
      .catch(() => {
        if (!cancelled) setScanError("No se pudo acceder a la cámara. Verificá los permisos.");
      });

    return () => {
      cancelled = true;
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
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
        {/* html5-qrcode renderiza el video dentro de este div */}
        <div
          id={CONTAINER_ID}
          className="h-full w-full [&>*]:!h-full [&>*]:!w-full [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
        />

        {/* Overlay de procesamiento */}
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="mt-4 text-sm font-medium text-white">Procesando...</p>
          </div>
        )}

        {/* Recuadro guía de escaneo */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative h-56 w-4/5 max-w-xs">
            <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-sm border-l-4 border-t-4 border-white" />
            <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-sm border-r-4 border-t-4 border-white" />
            <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-sm border-b-4 border-l-4 border-white" />
            <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-sm border-b-4 border-r-4 border-white" />
          </div>
          {!cameraReady && !scanError && (
            <p className="mt-4 text-sm text-white/80">Iniciando cámara...</p>
          )}
          {cameraReady && (
            <p className="mt-4 text-sm text-white/80">Apuntá el código al recuadro</p>
          )}
        </div>

        {/* Controles superiores */}
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

      {/* Zona de error */}
      {scanError && (
        <div className="bg-black px-4 py-3 text-center text-sm text-red-400">
          {scanError}
        </div>
      )}
    </div>
  );
}

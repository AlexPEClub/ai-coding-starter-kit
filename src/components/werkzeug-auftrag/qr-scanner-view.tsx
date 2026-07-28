"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Loader2 } from "lucide-react";
import QrScanner from "qr-scanner";

interface QrScannerViewProps {
  /** Wird bei jedem erkannten Code aufgerufen. Der Parent entscheidet, was mit dem Code passiert. */
  onScan: (code: string) => void;
  /** Scanner pausieren, z.B. während eine Anfrage für den letzten Scan noch läuft. */
  paused?: boolean;
}

/**
 * Kamera-basierter QR-Scanner (Browser, kein natives App nötig). Wird von
 * Fahrer- und Wareneingang-Flow gemeinsam genutzt (PROJ-34: eine zentrale
 * Scan-Komponente statt getrennter Implementierungen).
 */
export function QrScannerView({ onScan, paused = false }: QrScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [status, setStatus] = useState<"lädt" | "aktiv" | "fehler">("lädt");
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scanner = new QrScanner(
      video,
      (result) => {
        const code = result.data;
        const now = Date.now();
        // Doppel-Scan-Schutz: derselbe Code innerhalb von 2s wird ignoriert
        // (Edge Case "Doppel-Scan durch Wackler" aus der PROJ-34-Spec).
        if (
          lastScanRef.current &&
          lastScanRef.current.code === code &&
          now - lastScanRef.current.at < 2000
        ) {
          return;
        }
        lastScanRef.current = { code, at: now };
        onScan(code);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5,
      }
    );
    scannerRef.current = scanner;

    scanner
      .start()
      .then(() => setStatus("aktiv"))
      .catch((err) => {
        console.error("[QrScannerView] Kamera-Start fehlgeschlagen", err);
        setStatus("fehler");
      });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scannerRef.current) return;
    if (paused) {
      scannerRef.current.pause();
    } else if (status === "aktiv") {
      scannerRef.current.start().catch(() => {});
    }
  }, [paused, status]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      {status === "lädt" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Kamera wird gestartet…</p>
        </div>
      )}
      {status === "fehler" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-4 text-center text-white">
          <CameraOff className="h-6 w-6" />
          <p className="text-sm">
            Kamera nicht verfügbar. Bitte Kamera-Zugriff erlauben oder ein Gerät mit Kamera
            verwenden.
          </p>
        </div>
      )}
    </div>
  );
}

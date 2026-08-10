import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export function QRScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const regionId = "qr-reader";
    
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        regionId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [0] // Only camera
        },
        /* verbose= */ false
      );
      
      scanner.render(
        (decodedText, decodedResult) => {
          if (onScanSuccess) onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          if (onScanError) onScanError(errorMessage);
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  return <div id="qr-reader" className="w-full max-w-md mx-auto overflow-hidden rounded-xl border border-surface-200 bg-white"></div>;
}

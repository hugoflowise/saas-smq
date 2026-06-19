"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [value, size]);

  if (!dataUrl)
    return <div style={{ width: size, height: size }} className="rounded-lg bg-muted" />;
  // biome-ignore lint/performance/noImgElement: image générée localement (data URL), next/image inadapté.
  return (
    <img
      src={dataUrl}
      alt="QR code du questionnaire"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}

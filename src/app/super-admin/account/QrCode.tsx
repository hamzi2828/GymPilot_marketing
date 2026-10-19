"use client";

// A QR code drawn as inline SVG, for an authenticator app to scan. Drawn in
// the browser from qrcode-generator's module grid: no image request, no
// data: URL, and the secret it carries never leaves the page.

import { useMemo } from "react";
import qrcode from "qrcode-generator";

export default function QrCode({ value, size = 192, label }: { value: string; size?: number; label: string }) {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < n; row += 1) {
      for (let col = 0; col < n; col += 1) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { path: d, count: n };
  }, [value]);

  // Four modules of quiet zone, as scanners expect.
  const quiet = 4;
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${count + quiet * 2} ${count + quiet * 2}`}
      shapeRendering="crispEdges"
      className="rounded-lg border border-neutral-200 bg-white"
    >
      <rect x={-quiet} y={-quiet} width={count + quiet * 2} height={count + quiet * 2} fill="#ffffff" />
      <path d={path} fill="#0f172a" />
    </svg>
  );
}

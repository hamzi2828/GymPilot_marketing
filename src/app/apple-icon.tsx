import { ImageResponse } from "next/og";

// The icon a phone shows when the site is added to its home screen. The same
// G mark as icon.svg (three blocks, the crossbar lit mint to amber), on a
// full black square: the phone rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000" }}>
        <svg width="112" height="112" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="bar" x1="18" y1="0" x2="38" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#7FE3D2" />
              <stop offset="1" stopColor="#E5A34A" />
            </linearGradient>
          </defs>
          <path d="M2 18V12A10 10 0 0 1 12 2H38V10H14A4 4 0 0 0 10 14V18Z" fill="#F2F3F1" />
          <path d="M2 22H10V26A4 4 0 0 0 14 30H26A4 4 0 0 0 30 26V22H38V28A10 10 0 0 1 28 38H12A10 10 0 0 1 2 28Z" fill="#F2F3F1" />
          <path d="M18 13H38V19H18Z" fill="url(#bar)" />
        </svg>
      </div>
    ),
    size
  );
}

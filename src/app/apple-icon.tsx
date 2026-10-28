import { ImageResponse } from "next/og";

// The icon a phone shows when the site is added to its home screen: the same
// dumbbell as icon.svg on the mint to amber tile (the phone rounds the corners).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #7FE3D2 0%, #E5A34A 100%)" }}>
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path fill="#050707" d="M10 26h5v12h-5zM49 26h5v12h-5zM17 21h6v22h-6zM41 21h6v22h-6zM23 29h18v6H23z" />
        </svg>
      </div>
    ),
    size
  );
}

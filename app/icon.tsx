import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          background: "#001233",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 340, color: "#edecea",
          fontFamily: "serif",
        }}
      >
        同
      </div>
    ),
    size
  );
}

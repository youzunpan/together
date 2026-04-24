import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "同在 · TOGETHER",
    short_name: "同在",
    description: "一起靜坐的地方",
    start_url: "/feed",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1b18",
    theme_color: "#1a1b18",
    icons: [
      { src: "/icon", sizes: "any", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

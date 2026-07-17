import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StadiumPulse",
    short_name: "StadiumPulse",
    description:
      "GenAI incident triage for FIFA World Cup 2026 stadium operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: "#0B1220",
    icons: [{ src: "/icon.png", sizes: "64x64", type: "image/png" }],
  };
}

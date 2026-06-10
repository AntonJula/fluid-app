import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Fluid.",
    short_name: "Fluid.",
    description: "A calm hydration tracker with reminders, streaks, and local backups.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a5b84",
    theme_color: "#0a5b84",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: "/fluid-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/fluid-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/fluid-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Add 250 ml",
        short_name: "250 ml",
        description: "Log a daily glass of water.",
        url: "/?quickAdd=250",
        icons: [
          {
            src: "/fluid-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Open Stats",
        short_name: "Stats",
        description: "Check your hydration history.",
        url: "/stats",
        icons: [
          {
            src: "/fluid-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluid Hydration Tracker",
    short_name: "Fluid",
    description: "A calm hydration tracker with reminders, streaks, and local backups.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#082f49",
    theme_color: "#082f49",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

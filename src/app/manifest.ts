import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ultimate Life Dashboard",
    short_name: "Ultimate",
    description:
      "Personal productivity PWA for habits, tasks, workouts, finance, goals and notes.",
    start_url: "/",
    display: "standalone",
    background_color: "#060713",
    theme_color: "#060713",
    orientation: "portrait",
    categories: ["productivity", "health", "finance"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

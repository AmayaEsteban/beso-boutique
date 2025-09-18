// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // Opción 1 (recomendada): patrones remotos
    remotePatterns: [
      {
        protocol: "https",
        hostname: "beso-boutique-uploads.s3.us-east-2.amazonaws.com",
        port: "",
        pathname: "**",
      },
    ],
    // Opción 2 (alternativa simple): usa "domains" en lugar de remotePatterns
    // domains: ["beso-boutique-uploads.s3.us-east-2.amazonaws.com"],
  },
};

export default nextConfig;

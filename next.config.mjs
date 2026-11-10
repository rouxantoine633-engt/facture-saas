/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer"],
  // Polices du PDF lues au rendu (voir src/lib/pdf/fonts.ts) : à embarquer dans les fonctions
  // serverless des routes qui génèrent ou envoient un PDF.
  outputFileTracingIncludes: {
    "/app/**": ["./src/lib/pdf/fonts/*.ttf"],
    "/api/cron/**": ["./src/lib/pdf/fonts/*.ttf"],
  },
};

export default nextConfig;

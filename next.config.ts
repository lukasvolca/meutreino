import type { NextConfig } from "next";

// App 100% estático (HostGator): `npm run build` gera a pasta out/, que é enviada
// para treino.volca.com.br junto com a API PHP em /api.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

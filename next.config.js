/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necessário para o Dockerfile (copia .next/standalone)
  output: 'standalone',

  // Reduz chance de mismatch (HTML cacheado apontando para chunks inexistentes)
  // Observação: Cloudflare pode ignorar origin headers se houver regra “Cache Everything”.
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

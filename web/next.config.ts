import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Gera .next/standalone com runtime mínimo (usado pelo Dockerfile de produção). */
  output: 'standalone',
}

export default nextConfig

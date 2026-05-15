import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Gera .next/standalone com runtime mínimo (usado pelo Dockerfile de produção). */
  output: 'standalone',
  turbopack: {
    root: path.join(__dirname),
  },
}

export default nextConfig

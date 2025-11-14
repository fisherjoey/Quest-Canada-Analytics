import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'cpsc405.joeyfishertech.com',
      'localhost',
      '10.0.0.3'
    ]
  }
})

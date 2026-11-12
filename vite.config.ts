import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour PORT so a second instance can run alongside the first. The bridge
    // only accepts sockets from localhost:5173-5199, so stay inside that range
    // or set JARVIS_ALLOWED_ORIGINS to match.
    port: Number(process.env.PORT) || 5173,
    // Phone access through Tailscale Serve: it forwards the tailnet name
    // (<pc>.<tailnet>.ts.net) as the Host header, which Vite refuses unless
    // named. Only tailnet names are added; nothing else changes.
    allowedHosts: ['.ts.net'],
    // The bridge keeps listening on 127.0.0.1 only. A phone reaches it through
    // this same-origin proxy, so the agent is never exposed on the network.
    proxy: {
      '/bridge': {
        target: 'http://127.0.0.1:8787',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bridge/, ''),
      },
    },
  },
  optimizeDeps: {
    // kokoro-js pulls in `phonemizer`, which carries espeak-ng as inline WASM.
    // Vite's dependency pre-bundler rewrites that initialisation and the
    // language table ends up empty — the symptom is
    // `Invalid language identifier: "en". Should be one of: .` at generate()
    // time, long after the model has loaded successfully. Serving these
    // untouched fixes it.
    exclude: ['kokoro-js', 'phonemizer', '@huggingface/transformers'],
  },
})

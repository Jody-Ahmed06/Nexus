/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the MediaPipe WASM files from CDN
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
  // Suppress the Vapi/MediaPipe packages from SSR bundling
  serverExternalPackages: ["@vapi-ai/web", "@mediapipe/tasks-vision"],
  // Empty turbopack config tells Next.js we're intentionally using Turbopack
  turbopack: {},
};

module.exports = nextConfig;

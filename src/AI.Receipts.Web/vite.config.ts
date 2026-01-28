import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from '@vitejs/plugin-react'; // Add this import

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        plugins: [tailwindcss(), react()],
        build: {
            sourceMap: true,
            outDir: "build",
            emptyOutDir: true,
            assetsDir: "assets",
            rollupOptions: {
                output: {
                    manualChunks: undefined,
                    entryFileNames: `assets/index.js`,
                    chunkFileNames: `assets/[name]-chunk.js`,
                    assetFileNames: `assets/[name].[ext]`,
                    format: "es",
                },
            },
        },
        server: {
            port: 5173,
            host: true,
            proxy: {
                "/api": {
                    target: env.VITE_API_URL || "https://localhost:9020",
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
            },
        },
    };
});

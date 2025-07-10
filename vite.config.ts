import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['REACT_APP_', 'VITE_']);
  
  return {
    envPrefix: ['REACT_APP_', 'VITE_'],
    server: {
      host: "::",
      port: 8080,
      watch: {
        usePolling: true,
      },
    },
    plugins: [
      react(),
      nodePolyfills({
        protocolImports: true,
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "crypto": "crypto-browserify",
        "stream": "stream-browserify",
        "http": "stream-http",
        "https": "https-browserify",
        "os": "os-browserify",
        "url": "url",
        "path": "path-browserify",
        "util": "util",
        "buffer": "buffer",
        "process": "process/browser",
      },
    },
    define: {
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        REACT_APP_CHAIN_ID: JSON.stringify(env.REACT_APP_CHAIN_ID),
        REACT_APP_CHAIN_NAME: JSON.stringify(env.REACT_APP_CHAIN_NAME),
        REACT_APP_RPC_URL: JSON.stringify(env.REACT_APP_RPC_URL),
        REACT_APP_DEPOSIT_CONTRACT: JSON.stringify(env.REACT_APP_DEPOSIT_CONTRACT),
        REACT_APP_TOKEN_CONTRACT: JSON.stringify(env.REACT_APP_TOKEN_CONTRACT),
        REACT_APP_WALLETCONNECT_PROJECT_ID: JSON.stringify(env.REACT_APP_WALLETCONNECT_PROJECT_ID),
        VITE_ZKWASM_RPC_URL: JSON.stringify(env.VITE_ZKWASM_RPC_URL),
        VITE_ZKWASM_APP_NAME: JSON.stringify(env.VITE_ZKWASM_APP_NAME),
      },
      global: {},
    },
    optimizeDeps: {
      include: [
        'zkwasm-minirollup-browser',
        'zkwasm-minirollup-rpc', 
        'zkwasm-service-helper',
        'buffer',
        'process',
        'crypto-browserify',
        'stream-browserify',
        'stream-http',
        'https-browserify',
        'os-browserify',
        'url',
        'util',
      ],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    build: {
      commonjsOptions: {
        include: [/bn\.js/, /node_modules/],
        transformMixedEsModules: true,
      },
      rollupOptions: {
        external: [],
        output: {
          globals: {
            global: 'globalThis',
          },
        },
      },
    },
  };
});
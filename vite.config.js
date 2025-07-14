import { defineConfig } from 'vite';

export default defineConfig({
  // Base URL for deployment
  base: './',
  
  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    
    // Enable minification with esbuild (faster)
    minify: 'esbuild',
    
    // Generate source maps for debugging
    sourcemap: false,
    
    // Optimize for production
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'gallery': ['./src/js/gallery.js']
        },
        // Asset naming for cache busting
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset size warnings
    chunkSizeWarningLimit: 1000,
    
    // Target modern browsers for smaller bundles
    target: 'es2015'
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    open: true
  },
  
  // CSS configuration
  css: {
    // CSS modules
    modules: false,
    
    // PostCSS config (if needed later)
    postcss: {}
  },
  
  // Performance optimizations
  optimizeDeps: {
    // Pre-bundle dependencies
    include: []
  }
});
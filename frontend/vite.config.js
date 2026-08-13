import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- Ye add kiya

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <-- Yahan plugin load kiya
  ],
})
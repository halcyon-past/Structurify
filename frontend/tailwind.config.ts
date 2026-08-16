import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      
      fontFamily: {
        sans: ['var(--font-space-grotesk)'],
        mono: ['var(--font-jetbrains-mono)'],
      },
      colors: {
        background: "#09090b", // Deep dark background
        foreground: "#f8fafc", // Light foreground
        glass: "rgba(255, 255, 255, 0.05)",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        accent: {
          500: "#8b5cf6", // Violet
          600: "#7c3aed",
        }
      },
      animation: {
        'blob': "blob 7s infinite",
        'pulse-slow': "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        'glow': "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(139, 92, 246, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(139, 92, 246, 0.4)" }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;

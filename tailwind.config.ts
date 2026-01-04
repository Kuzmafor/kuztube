import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // KuzTube dark theme colors (YouTube-like)
        'kuztube-bg': '#0f0f0f',
        'kuztube-bg-secondary': '#1f1f1f',
        'kuztube-bg-hover': '#272727',
        'kuztube-border': '#3f3f3f',
        'kuztube-text': '#f1f1f1',
        'kuztube-text-secondary': '#aaaaaa',
        'kuztube-red': '#ff0000',
      },
    },
  },
  plugins: [],
};

export default config;

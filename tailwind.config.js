/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        appBg: "#F8FAFC",
        appSurface: "#FFFFFF",
        brandIndigo: "#4F46E5",
        brandViolet: "#7C3AED",
        appText: "#0F172A",
        appMuted: "#64748B",
        appSuccess: "#10B981",
        appBorder: "#E2E8F0",
      },
      fontFamily: {
        brand: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(79, 70, 229, 0.1)",
        "soft-lg":
          "0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.1)",
        "brand-btn": "0 4px 14px 0 rgba(79, 70, 229, 0.3)",
        "brand-btn-lg": "0 8px 18px 0 rgba(79, 70, 229, 0.35)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

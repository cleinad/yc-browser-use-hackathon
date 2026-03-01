// hero.ts
import { heroui } from "@heroui/react";

export default heroui({
  defaultTheme: "dark",
  themes: {
    dark: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        success: { DEFAULT: "#22c55e", foreground: "#ffffff" },
        danger: { DEFAULT: "#ef4444", foreground: "#ffffff" },
        warning: { DEFAULT: "#f59e0b", foreground: "#000000" },
      },
    },
  },
});

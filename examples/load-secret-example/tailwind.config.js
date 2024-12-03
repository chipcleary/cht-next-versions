/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', // Root-level src files
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    // Add any other paths where you use Tailwind CSS classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

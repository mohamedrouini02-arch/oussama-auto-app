/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class', // 'selector' is v4, but 'class' is often safer for hybrid setups. next-themes uses 'class' strategy.
    theme: {
        extend: {},
    },
    plugins: [],
}

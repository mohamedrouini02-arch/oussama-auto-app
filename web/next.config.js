const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

// const withSerwist = require("@serwist/next").default({
//   swSrc: "app/sw.ts",
//   swDest: "public/sw.js",
// });

module.exports = nextConfig; // withSerwist(nextConfig);

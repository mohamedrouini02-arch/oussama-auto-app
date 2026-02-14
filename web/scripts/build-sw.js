const { injectManifest } = require("@serwist/build");

async function buildSW() {
    try {
        await injectManifest({
            swSrc: "app/sw.ts",
            swDest: "public/sw.js",
            globDirectory: ".next/server/app",
            globPatterns: ["**/*.html", "**/*.json", "**/*.js", "**/*.css"],
            // Adjust globDirectory and patterns based on your build output structure
            // For App Router, static assets are usually in .next/static or public
            additionalPrecacheEntries: [
                // Add static assets here if needed
            ],
        });
        console.log("Service worker built successfully!");
    } catch (error) {
        console.error("Error building service worker:", error);
        process.exit(1);
    }
}

buildSW();

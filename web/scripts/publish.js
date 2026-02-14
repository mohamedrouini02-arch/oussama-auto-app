require('dotenv').config({ path: '.env.local' })
const { execSync } = require('child_process')

// Check if GH_TOKEN is set
if (!process.env.GH_TOKEN) {
    console.error('❌ Error: GH_TOKEN not found in .env.local')
    console.error('Please create a .env.local file and add your GitHub token:')
    console.error('GH_TOKEN=your_github_token_here')
    console.error('\nGet your token from: https://github.com/settings/tokens')
    console.error('Required scopes: repo (full control)')
    process.exit(1)
}

console.log('✅ GH_TOKEN found, proceeding with build and publish...')

try {
    // Run the electron build command which will also publish to GitHub
    execSync('npm run electron:build -- --publish always', {
        stdio: 'inherit',
        env: { ...process.env, GH_TOKEN: process.env.GH_TOKEN }
    })
    console.log('✅ Build and publish completed successfully!')
} catch (error) {
    console.error('❌ Build or publish failed:', error.message)
    process.exit(1)
}

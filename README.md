# Alpha Loader

A simple, beautiful web application to track and earn passive income streams in real-time. Watch your earnings accumulate second by second with a stunning animated background and withdraw anytime with fast payment system and reat time mining interface.

## Features

- **Fast And Easy Withdrawal**: Withdraw your earnings fast and easily
- **Real-time Income Counter**: See your passive income accumulate in real-time
- **Multiple Time Periods**: Track income by second, day, week, month, or year
- **Bitcoin Support**: Track income in both USD and Bitcoin (BTC/sats)
- **Live Bitcoin Price**: Automatically fetches current Bitcoin price
- **Beautiful UI**: Animated beam background creates a stunning visual experience
- **Persistent Storage**: Your income streams are saved locally in your browser

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/iconfarvie-coder/AlphaLoader.git
cd AlphaLoader
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### GitHub Pages

This project is configured for easy deployment to GitHub Pages:

1. Update the `basePath` in `next.config.mjs` to match your repository name
2. Push your code to GitHub
3. GitHub Actions will automatically build and deploy your site

### Other Hosting Options

To deploy to other static hosting services:

1. Build the project:
\`\`\`bash
npm run build
\`\`\`

2. The static files will be in the `out` directory, which you can upload to any static hosting service.

## Technologies Used

- Next.js
- React
- Tailwind CSS
- shadcn/ui
- CoinGecko API for Bitcoin prices

## License

This project is licensed under the MIT License - see the LICENSE file for details.

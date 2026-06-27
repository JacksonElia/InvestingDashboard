# Investing Dashboard

A modern, production-ready investment portfolio management dashboard built with React, TypeScript, and Vite. Features real-time stock price tracking, portfolio analytics, and automatic persistence.

## Features

- **Portfolio Management**: Add, edit, and delete investments with real-time price updates
- **Price Tracking**: Automatic stock price fetching using Yahoo Finance
- **Analytics**: Portfolio statistics, asset allocation, and performance history
- **Data Persistence**: All data automatically saved to browser's localStorage
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Production-Ready**: Optimized for Vercel serverless deployment

## Installation

```bash
npm install
```

## Development

### Local Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

Create an optimized production build:

```bash
npm run build
```

Output is created in the `dist/` directory.

## Deployment

### Deploy to Vercel

1. **Prerequisites**: Push your code to GitHub

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." and select "Project"
   - Import your GitHub repository

3. **Configure Deployment**:
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - The `vercel.json` file handles API routing automatically

4. **Deploy**:
   - Push to main branch to auto-deploy
   - Vercel will run `npm run build` and deploy both frontend and API functions

### Frontend Storage

The dashboard uses browser localStorage for all data persistence:
- Portfolio items are saved automatically
- No database setup required
- Data persists across browser sessions
- Works offline (with cached prices)

## Code Quality

### Linting

```bash
npm run lint
```

### Preview

Preview the production build locally:

```bash
npm run preview
```

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Stock Data**: Yahoo Finance API
- **Deployment**: Vercel (Frontend + Serverless Functions)
- **State Management**: React Hooks

## Architecture

### Frontend (`src/`)
- **Features**: Page-level components (Home, Portfolio, etc.)
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks (usePortfolio)
- **Services**: Data layer (portfolioService)
- **Lib**: Utilities and analytics

### Backend (`api/`)
- **Serverless Functions**: Deployed to Vercel
- **`api/stock-price.ts`**: Fetches real-time stock prices with 5-minute caching

## File Structure

```
.
├── api/
│   └── stock-price.ts          # Serverless function for price fetching
├── src/
│   ├── components/             # Reusable UI components
│   ├── features/               # Feature modules (Home, Portfolio, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # Data layer
│   ├── lib/                    # Utilities and analytics
│   ├── types/                  # TypeScript definitions
│   └── main.tsx                # Entry point
├── vercel.json                 # Vercel deployment config
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Contributing

Contributions are welcome! Please ensure:
- Code passes linting (`npm run lint`)
- Build succeeds (`npm run build`)
- No console.log statements in production code

## License

MIT

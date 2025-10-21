# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a client-side stock trading record application built with vanilla JavaScript, HTML, and CSS. The application allows users to track stock transactions, calculate holdings, analyze profits/losses, and manage settings - all stored in the browser's localStorage.

## Architecture
The application follows a modular architecture with clear separation of concerns:

1. **main.js** - Application entry point that bootstraps the UI
2. **ui.js** - DOM rendering and event handling logic
3. **calculations.js** - Business logic for stock calculations (holdings, balance, profit analysis)
4. **storage.js** - Local storage management with legacy data migration
5. **index.html** - Main HTML structure with all views
6. **style.css** - Complete styling with dark mode support

## Common Development Tasks

### Running the Application
```bash
# Start development server on port 5173
npm run serve
```

### Running Tests
```bash
# Open test HTML file in browser
npm run test
```

## Key Features
- Add/edit/delete stock transactions (buy/sell)
- Calculate holdings with weighted average cost
- Account balance tracking with commission fees
- Profit/loss analysis with real-time price inputs
- Data persistence using localStorage
- Export/import functionality
- Responsive design with dark mode support
- Transaction history with filtering options

## Data Structure
The application uses the following data structure for transactions:
```javascript
{
  id: string,
  code: string,        // Stock symbol (e.g., "AAPL")
  name: string,        // Stock name (e.g., "Apple")
  type: 'buy'|'sell',
  price: number,       // Price per share
  quantity: number,    // Number of shares
  date: string         // YYYY-MM-DD format
}
```

## Testing
The project uses a custom HTML-based test framework located in `tests/calculations.test.html` which tests the core calculation functions.
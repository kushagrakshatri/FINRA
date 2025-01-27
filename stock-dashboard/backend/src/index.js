const express = require('express');
const { WebSocketServer } = require('ws');
const NodeCache = require('node-cache');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Setup in-memory cache
const cache = new NodeCache({ stdTTL: 60 });

// Express middleware
app.use(cors());
app.use(express.json());

// WebSocket server setup
const wss = new WebSocketServer({ port: 3002 });

// Store active connections
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New WebSocket connection established');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'SUBSCRIBE_STOCKS') {
        // Handle stock subscription
        handleStockSubscription(ws, data.symbols);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

// Stock data handling
async function handleStockSubscription(ws, symbols) {
  for (const symbol of symbols) {
    try {
      // Check cache first
      const cachedData = cache.get(`stock:${symbol}`);
      if (cachedData) {
        ws.send(JSON.stringify({
          type: 'STOCK_UPDATE',
          symbol,
          data: JSON.parse(cachedData)
        }));
      }

      // Fetch fresh data
      const result = await yahooFinance.search(symbol);
      const quote = result.quotes[0];
      const data = {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        timestamp: new Date().toISOString()
      };

      // Cache the data
      cache.set(`stock:${symbol}`, JSON.stringify(data));

      // Send to client
      ws.send(JSON.stringify({
        type: 'STOCK_UPDATE',
        symbol,
        data
      }));
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
    }
  }
}

// REST endpoints
app.get('/api/stocks/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1d' } = req.query;

    // Check cache
    const cacheKey = `history:${symbol}:${period}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    // Calculate time range based on period
    let startDate = new Date();
    switch(period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1wk':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1mo':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1); // default to 1 day
    }

    // Fetch historical data
    const queryOptions = {
      period1: startDate,
      period2: new Date(),
      interval: period // Use the period as interval ('1d', '1wk', or '1mo')
    };

    const result = await yahooFinance.historical(symbol, queryOptions);

    if (!result || result.length === 0) {
      throw new Error(`No historical data available for symbol: ${symbol}`);
    }
    
    // Format the data
    const formattedData = result.map(item => ({
      date: item.date,
      open: item.open || null,
      high: item.high || null,
      low: item.low || null,
      close: item.close || null,
      volume: item.volume || 0
    }));
    
    // Cache the formatted data
    cache.set(cacheKey, formattedData, 300);
    
    res.json(formattedData);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

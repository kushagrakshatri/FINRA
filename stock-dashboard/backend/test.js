const yahooFinance = require('yahoo-finance2');

async function test() {
    try {
        // Get available methods
        console.log('Available methods:', Object.getOwnPropertyNames(yahooFinance));
        
        // Test historical data fetch
        const queryOptions = {
            period1: '2024-01-01',
            period2: '2024-01-31',
            interval: '1d'
        };
        
        // Try different method names
        const result = await yahooFinance.historical('AAPL', queryOptions);
        console.log('Historical data:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();

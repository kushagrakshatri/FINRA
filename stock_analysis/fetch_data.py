import yfinance as yf
import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime, timedelta

# Create SQLite database engine
engine = create_engine('sqlite:///stock_data.db')

# List of tech companies to analyze
stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']

# Download 5 years of data for each stock
end_date = datetime.now()
start_date = end_date - timedelta(days=5*365)

# Fetch and store data for each stock
for symbol in stocks:
    print(f"Fetching data for {symbol}...")
    stock = yf.Ticker(symbol)
    df = stock.history(start=start_date, end=end_date)
    
    # Reset index to make Date a column
    df.reset_index(inplace=True)
    
    # Save to SQLite database
    table_name = f'stock_{symbol.lower()}'
    df.to_sql(table_name, engine, if_exists='replace', index=False)
    print(f"Saved {len(df)} records for {symbol}")

print("\nData collection complete!")

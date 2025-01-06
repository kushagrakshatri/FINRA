import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sqlalchemy import create_engine
from datetime import datetime

# Connect to SQLite database
engine = create_engine('sqlite:///stock_data.db')

# List of stocks to analyze
stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']

# Function to load and process stock data
def load_stock_data(symbol):
    table_name = f'stock_{symbol.lower()}'
    df = pd.read_sql(f'SELECT Date, Close FROM {table_name}', engine)
    df['Date'] = pd.to_datetime(df['Date'])
    df.set_index('Date', inplace=True)
    df.columns = [symbol]
    return df

# Load all stock data
dfs = [load_stock_data(symbol) for symbol in stocks]
combined_df = pd.concat(dfs, axis=1)

# Calculate daily returns
returns_df = combined_df.pct_change()

# Calculate 30-day moving averages
ma_df = combined_df.rolling(window=30).mean()

# Create directory for plots
import os
os.makedirs('plots', exist_ok=True)

# 1. Plot stock prices over time
plt.figure(figsize=(15, 8))
for stock in stocks:
    plt.plot(combined_df.index, combined_df[stock], label=stock)
plt.title('Stock Prices Over Time')
plt.xlabel('Date')
plt.ylabel('Price (USD)')
plt.legend()
plt.grid(True)
plt.savefig('plots/stock_prices.png')
plt.close()

# 2. Plot correlation heatmap
plt.figure(figsize=(10, 8))
sns.heatmap(returns_df.corr(), annot=True, cmap='coolwarm', center=0)
plt.title('Stock Returns Correlation Matrix')
plt.savefig('plots/correlation_matrix.png')
plt.close()

# 3. Calculate and display summary statistics
summary_stats = pd.DataFrame({
    'Mean Daily Return': returns_df.mean(),
    'Std Dev Daily Return': returns_df.std(),
    'Annualized Volatility': returns_df.std() * np.sqrt(252),
    'Sharpe Ratio': (returns_df.mean() / returns_df.std()) * np.sqrt(252)
})

# Save summary statistics to CSV
summary_stats.to_csv('plots/summary_statistics.csv')

# Print analysis results
print("\nAnalysis Results:")
print("\nCorrelation Analysis:")
print(returns_df.corr().round(3))
print("\nSummary Statistics:")
print(summary_stats.round(3))

# Calculate and print best and worst performing stocks
total_returns = (combined_df.iloc[-1] / combined_df.iloc[0] - 1) * 100
print("\nTotal Returns:")
for stock in stocks:
    print(f"{stock}: {total_returns[stock]:.2f}%")

print("\nAnalysis complete! Check the 'plots' directory for visualizations.")

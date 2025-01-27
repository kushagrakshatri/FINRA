import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { createChart } from 'lightweight-charts';

const WidgetContainer = styled.div`
  background: #1e222d;
  border-radius: 8px;
  padding: 16px;
  color: white;
`;

const PortfolioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
`;

const PortfolioCard = styled.div`
  background: #2a2e39;
  padding: 12px;
  border-radius: 4px;
`;

const PortfolioValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.color || 'white'};
`;

const PortfolioLabel = styled.div`
  font-size: 14px;
  color: #999;
  margin-top: 4px;
`;

const HoldingsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  
  th, td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #2a2e39;
  }
  
  th {
    color: #999;
    font-weight: normal;
  }
`;

const mockPortfolio = {
  holdings: [
    { symbol: 'AAPL', shares: 10, costBasis: 150 },
    { symbol: 'MSFT', shares: 5, costBasis: 300 },
    { symbol: 'GOOGL', shares: 2, costBasis: 2800 },
    { symbol: 'AMZN', shares: 3, costBasis: 3300 },
    { symbol: 'META', shares: 8, costBasis: 330 },
  ]
};

export const PortfolioAnalysisWidget = () => {
  const [portfolio, setPortfolio] = useState({
    totalValue: 0,
    totalGain: 0,
    gainPercentage: 0,
    holdings: []
  });

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        const holdingsWithPrices = await Promise.all(
          mockPortfolio.holdings.map(async (holding) => {
            const response = await fetch(`http://localhost:3001/api/stocks/${holding.symbol}/history`);
            const data = await response.json();
            const currentPrice = data[data.length - 1].close;
            
            const value = holding.shares * currentPrice;
            const cost = holding.shares * holding.costBasis;
            const gain = value - cost;
            const gainPercentage = (gain / cost) * 100;

            return {
              ...holding,
              currentPrice,
              value,
              gain,
              gainPercentage
            };
          })
        );

        const totalValue = holdingsWithPrices.reduce((sum, h) => sum + h.value, 0);
        const totalCost = holdingsWithPrices.reduce((sum, h) => sum + (h.shares * h.costBasis), 0);
        const totalGain = totalValue - totalCost;
        const totalGainPercentage = (totalGain / totalCost) * 100;

        setPortfolio({
          totalValue,
          totalGain,
          gainPercentage: totalGainPercentage,
          holdings: holdingsWithPrices
        });

      } catch (error) {
        console.error('Error fetching portfolio data:', error);
      }
    };

    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <WidgetContainer>
      <h3>Portfolio Analysis</h3>
      <PortfolioGrid>
        <PortfolioCard>
          <PortfolioValue>
            ${portfolio.totalValue.toLocaleString(undefined, { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </PortfolioValue>
          <PortfolioLabel>Total Portfolio Value</PortfolioLabel>
        </PortfolioCard>
        <PortfolioCard>
          <PortfolioValue 
            color={portfolio.totalGain >= 0 ? '#44ff44' : '#ff4444'}
          >
            ${portfolio.totalGain.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            ({portfolio.gainPercentage.toFixed(2)}%)
          </PortfolioValue>
          <PortfolioLabel>Total Gain/Loss</PortfolioLabel>
        </PortfolioCard>
      </PortfolioGrid>

      <HoldingsTable>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Shares</th>
            <th>Current Price</th>
            <th>Value</th>
            <th>Gain/Loss</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.holdings.map((holding) => (
            <tr key={holding.symbol}>
              <td>{holding.symbol}</td>
              <td>{holding.shares}</td>
              <td>${holding.currentPrice.toFixed(2)}</td>
              <td>${holding.value.toFixed(2)}</td>
              <td style={{ color: holding.gain >= 0 ? '#44ff44' : '#ff4444' }}>
                ${holding.gain.toFixed(2)} ({holding.gainPercentage.toFixed(2)}%)
              </td>
            </tr>
          ))}
        </tbody>
      </HoldingsTable>
    </WidgetContainer>
  );
};

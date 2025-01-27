import { useState } from 'react';
import styled from 'styled-components';
import { PriceTrackerWidget } from './components/PriceTrackerWidget';
import { PerformanceMetricsWidget } from './components/PerformanceMetricsWidget';
import { PortfolioAnalysisWidget } from './components/PortfolioAnalysisWidget';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #141722;
  padding: 20px;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Header = styled.header`
  color: white;
  margin-bottom: 20px;
  max-width: 1400px;
  margin: 0 auto 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
`;

const StockSelector = styled.select`
  background: #2a2e39;
  color: white;
  padding: 8px;
  border: 1px solid #3a3f4c;
  border-radius: 4px;
  margin-top: 10px;
  
  option {
    background: #2a2e39;
  }
`;

const WidgetContainer = styled.div`
  & > * {
    margin-bottom: 20px;
  }
`;

function App() {
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];

  return (
    <AppContainer>
      <Header>
        <Title>Financial Stock Analysis Dashboard</Title>
        <StockSelector 
          value={selectedStock} 
          onChange={(e) => setSelectedStock(e.target.value)}
        >
          {stocks.map(stock => (
            <option key={stock} value={stock}>{stock}</option>
          ))}
        </StockSelector>
      </Header>

      <DashboardGrid>
        <WidgetContainer>
          <PriceTrackerWidget symbol={selectedStock} />
          <PerformanceMetricsWidget symbol={selectedStock} />
        </WidgetContainer>
        <WidgetContainer>
          <PortfolioAnalysisWidget />
        </WidgetContainer>
      </DashboardGrid>
    </AppContainer>
  );
}

export default App;

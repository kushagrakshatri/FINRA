import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { createChart, LineStyle } from 'lightweight-charts';

const WidgetContainer = styled.div`
  background: #1e222d;
  border-radius: 8px;
  padding: 16px;
  color: white;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
`;

const MetricCard = styled.div`
  background: #2a2e39;
  padding: 12px;
  border-radius: 4px;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.color || 'white'};
`;

const MetricLabel = styled.div`
  font-size: 14px;
  color: #999;
  margin-top: 4px;
`;

const calculateSMA = (data, period) => {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
    sma.push({
      time: data[i].time,
      value: sum / period
    });
  }
  return sma;
};

const calculateRSI = (data, period = 14) => {
  let gains = [];
  let losses = [];
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate average gains and losses
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  
  const rsiData = [];
  
  // Calculate RSI
  for (let i = period; i < data.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    rsiData.push({
      time: data[i].time,
      value: rsi
    });
  }
  
  return rsiData;
};

export const PerformanceMetricsWidget = ({ symbol }) => {
  const [metrics, setMetrics] = useState({
    sma20: null,
    sma50: null,
    rsi: null,
    trend: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/stocks/${symbol}/history`);
        const data = await response.json();
        
        const formattedData = data.map(item => ({
          time: new Date(item.date).getTime() / 1000,
          close: item.close
        }));

        const sma20Data = calculateSMA(formattedData, 20);
        const sma50Data = calculateSMA(formattedData, 50);
        const rsiData = calculateRSI(formattedData);

        // Get latest values
        const latestSMA20 = sma20Data[sma20Data.length - 1]?.value;
        const latestSMA50 = sma50Data[sma50Data.length - 1]?.value;
        const latestRSI = rsiData[rsiData.length - 1]?.value;
        const latestPrice = formattedData[formattedData.length - 1]?.close;

        setMetrics({
          sma20: latestSMA20?.toFixed(2),
          sma50: latestSMA50?.toFixed(2),
          rsi: latestRSI?.toFixed(2),
          trend: latestPrice > latestSMA20 ? 'bullish' : 'bearish'
        });

      } catch (error) {
        console.error('Error fetching performance metrics:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <WidgetContainer>
      <h3>{symbol} Performance Metrics</h3>
      <MetricsGrid>
        <MetricCard>
          <MetricValue>SMA 20: {metrics.sma20}</MetricValue>
          <MetricLabel>20-Day Moving Average</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>SMA 50: {metrics.sma50}</MetricValue>
          <MetricLabel>50-Day Moving Average</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue 
            color={metrics.rsi > 70 ? '#ff4444' : metrics.rsi < 30 ? '#44ff44' : 'white'}
          >
            RSI: {metrics.rsi}
          </MetricValue>
          <MetricLabel>Relative Strength Index</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue color={metrics.trend === 'bullish' ? '#44ff44' : '#ff4444'}>
            {metrics.trend?.toUpperCase()}
          </MetricValue>
          <MetricLabel>Current Trend</MetricLabel>
        </MetricCard>
      </MetricsGrid>
    </WidgetContainer>
  );
};

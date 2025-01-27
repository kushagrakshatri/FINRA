import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import styled from 'styled-components';
import useWebSocket from 'react-use-websocket';

const WidgetContainer = styled.div`
  background: #1e222d;
  border-radius: 8px;
  padding: 16px;
  color: white;
  height: 400px;
`;

const ChartContainer = styled.div`
  height: 100%;
`;

export const PriceTrackerWidget = ({ symbol }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);

  const { lastJsonMessage } = useWebSocket('ws://localhost:3002', {
    onOpen: () => {
      console.log('WebSocket connected');
      // Subscribe to stock updates
      sendJsonMessage({ type: 'SUBSCRIBE_STOCKS', symbols: [symbol] });
    },
    onMessage: () => {
      if (lastJsonMessage?.type === 'STOCK_UPDATE' && lastJsonMessage.symbol === symbol) {
        updateChart(lastJsonMessage.data);
      }
    },
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#1E222D' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    candlestickSeriesRef.current = chartRef.current.addCandlestickSeries();

    // Fetch historical data
    fetch(`http://localhost:3001/api/stocks/${symbol}/history`)
      .then(response => response.json())
      .then(data => {
        const formattedData = data.map(item => ({
          time: new Date(item.date).getTime() / 1000,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }));
        candlestickSeriesRef.current.setData(formattedData);
      });

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [symbol]);

  const updateChart = (data) => {
    if (!candlestickSeriesRef.current) return;
    
    candlestickSeriesRef.current.update({
      time: new Date(data.timestamp).getTime() / 1000,
      open: data.price,
      high: data.price,
      low: data.price,
      close: data.price,
    });
  };

  return (
    <WidgetContainer>
      <h3>{symbol} Price Chart</h3>
      <ChartContainer ref={chartContainerRef} />
    </WidgetContainer>
  );
};

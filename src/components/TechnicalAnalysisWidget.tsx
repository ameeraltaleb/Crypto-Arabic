import { useEffect, useRef, memo } from 'react';

interface TechnicalAnalysisWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  interval?: string;
  width?: string | number;
  height?: string | number;
  locale?: string;
}

const TechnicalAnalysisWidget = ({
  symbol = "BINANCE:BTCUSDT",
  theme = "dark",
  interval = "1D",
  width = "100%",
  height = 450,
  locale = "ar_AE"
}: TechnicalAnalysisWidgetProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous content
    container.current.innerHTML = '';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval,
      width,
      isTransparent: true,
      height,
      symbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale,
      colorTheme: theme
    });
    
    container.current.appendChild(script);
  }, [symbol, theme, interval, width, height, locale]);

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
};

export default memo(TechnicalAnalysisWidget);

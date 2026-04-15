import { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  height?: number | string;
  width?: number | string;
  interval?: string;
  timezone?: string;
  style?: string;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  hide_top_toolbar?: boolean;
  hide_legend?: boolean;
  save_image?: boolean;
  container_id?: string;
}

const TradingViewWidget = ({
  symbol = "BINANCE:BTCUSDT",
  theme = "dark",
  autosize = true,
  height = 500,
  width = "100%",
  interval = "D",
  timezone = "Etc/UTC",
  style = "1",
  locale = "ar",
  toolbar_bg = "#f1f3f6",
  enable_publishing = false,
  hide_top_toolbar = false,
  hide_legend = false,
  save_image = true,
  container_id = "tradingview_advanced_chart"
}: TradingViewWidgetProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      if (container.current && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize,
          symbol,
          interval,
          timezone,
          theme,
          style,
          locale,
          toolbar_bg,
          enable_publishing,
          hide_top_toolbar,
          hide_legend,
          save_image,
          container_id: container.current.id,
          width: "100%",
          height: height,
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed, though TradingView widget usually handles itself
    };
  }, [symbol, theme, interval, timezone, style, locale, height, autosize]);

  return (
    <div className="tradingview-widget-container" style={{ height: height, width: "100%" }}>
      <div id={container_id} ref={container} style={{ height: "100%", width: "100%" }} />
    </div>
  );
};

export default memo(TradingViewWidget);

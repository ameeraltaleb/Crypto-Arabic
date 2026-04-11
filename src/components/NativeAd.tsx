import { useRef, useEffect } from 'react';

export default function NativeAd() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    initialized.current = true;

    const adHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            background: transparent;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="container-d4c25f36b6b36f3d9a865338db4909d4"></div>
        <script async="async" data-cfasync="false" src="https://pl29118903.profitablecpmratenetwork.com/d4c25f36b6b36f3d9a865338db4909d4/invoke.js"></script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(adHtml);
    doc.close();
  }, []);

  return (
    <div className="w-full my-8 flex justify-center items-center overflow-hidden bg-transparent rounded-xl">
      <iframe
        ref={iframeRef}
        title="Advertisement"
        style={{ 
          border: 'none', 
          width: '100%', 
          height: '250px', // Fixed height to prevent layout shifts and accommodate native ads
          overflow: 'hidden' 
        }}
        scrolling="no"
      />
    </div>
  );
}

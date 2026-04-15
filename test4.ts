import https from 'https';

https.get('https://tailwindcss.com/docs/dark-mode', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/If you want your dark theme to be driven by a CSS sel[\s\S]{0,500}/gi);
    console.log(matches?.[0]);
  });
});

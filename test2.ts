import https from 'https';

https.get('https://tailwindcss.com/docs/dark-mode', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/.{0,100}dark mode.{0,100}/gi);
    console.log(matches?.slice(0, 10));
  });
});

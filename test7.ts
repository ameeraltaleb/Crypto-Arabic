import https from 'https';

https.get('https://tailwindcss.com/docs/dark-mode', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/@custom-variant dark[^<]*/g);
    console.log(matches);
  });
});

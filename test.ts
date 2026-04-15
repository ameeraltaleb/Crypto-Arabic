import https from 'https';

https.get('https://tailwindcss.com/docs/dark-mode', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/@custom-variant[^<]*/g) || data.match(/@variant[^<]*/g) || data.match(/dark[^<]*/g);
    console.log(matches?.slice(0, 20));
  });
});

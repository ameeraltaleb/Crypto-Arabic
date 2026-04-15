import https from 'https';

https.get('https://tailwindcss.com/docs/dark-mode', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/.{0,100}Toggling dark mode manually.{0,100}/gi);
    console.log(matches?.slice(0, 10));
    const matches2 = data.match(/.{0,100}custom-variant.{0,100}/gi);
    console.log(matches2?.slice(0, 10));
  });
});

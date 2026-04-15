import https from 'https';

https.get('https://tailwindcss.com/docs/dark-mode', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const matches = data.match(/override the <code>dark<\/code> variant to use your custom selector:<\/p>[\s\S]{0,2000}/gi);
    console.log(matches?.[0].replace(/<[^>]+>/g, ''));
  });
});

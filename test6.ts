import https from 'https';

https.get('https://tailwindcss.com/docs/dark-mode', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const lines = data.split('\n');
    for (const line of lines) {
      if (line.includes('@custom-variant dark')) {
        console.log(line.replace(/<[^>]+>/g, ''));
      }
    }
  });
});

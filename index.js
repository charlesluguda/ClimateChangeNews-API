const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

const newspapers = [
  { name: 'cityam', address: 'https://www.cityam.com/london-must-become-a-world-leader-on-climate-change-action/', base: '' },
  { name: 'thetimes', address: 'https://www.thetimes.co.uk/environment/climate-change', base: '' },
  { name: 'guardian', address: 'https://www.theguardian.com/environment/climate-crisis', base: '' },
  { name: 'telegraph', address: 'https://www.telegraph.co.uk/climate-change', base: 'https://www.telegraph.co.uk' },
  { name: 'nyt', address: 'https://www.nytimes.com/international/section/climate', base: '' },
  { name: 'latimes', address: 'https://www.latimes.com/environment', base: '' },
  { name: 'smh', address: 'https://www.smh.com.au/environment/climate-change', base: 'https://www.smh.com.au' },
  { name: 'un', address: 'https://www.un.org/climatechange', base: '' },
  { name: 'bbc', address: 'https://www.bbc.co.uk/news/science_and_environment', base: 'https://www.bbc.co.uk' },
  { name: 'es', address: 'https://www.standard.co.uk/topic/climate-change', base: 'https://www.standard.co.uk' },
  { name: 'sun', address: 'https://www.thesun.co.uk/topic/climate-change-environment/', base: '' },
  { name: 'dm', address: 'https://www.dailymail.co.uk/news/climate_change_global_warming/index.html', base: '' },
  { name: 'nyp', address: 'https://nypost.com/tag/climate-change/', base: '' }
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

const articles = [];

const fetchArticles = async () => {
  const fetchPromises = newspapers.map(newspaper => {
    return axios.get(newspaper.address, { headers })
      .then(response => {
        const html = response.data;
        const $ = cheerio.load(html);

        $('a:contains("climate")', html).each(function () {
          const title = $(this).text();
          let url = $(this).attr('href');

          if (!url.startsWith('http')) {
            url = newspaper.base + url;
          }

          articles.push({
            title,
            url,
            source: newspaper.name
          });
        });
      })
      .catch(error => {
        console.error(`Error fetching ${newspaper.name}: `, error.message);
      });
  });

  await Promise.all(fetchPromises);
};

fetchArticles();

app.get('/', (req, res) => {
  res.json('Welcome to my Climate Change News API');
});

app.get('/news', (req, res) => {
  res.json(articles);
});

app.get('/news/:newspaperId', async (req, res) => {
  const newspaperId = req.params.newspaperId;
  const newspaper = newspapers.find(n => n.name === newspaperId);

  if (!newspaper) {
    return res.status(404).json({ error: 'Newspaper not found' });
  }

  try {
    const response = await axios.get(newspaper.address, { headers });
    const html = response.data;
    const $ = cheerio.load(html);
    const specificArticles = [];

    $('a:contains("climate")', html).each(function () {
      const title = $(this).text();
      let url = $(this).attr('href');

      if (!url.startsWith('http')) {
        url = newspaper.base + url;
      }

      specificArticles.push({
        title,
        url,
        source: newspaperId
      });
    });

    res.json(specificArticles);
  } catch (error) {
    console.error(`Error fetching ${newspaperId}: `, error.message);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

module.exports = app;

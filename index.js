const express = require('express');
const axios = require('axios');

const app = express();

async function fetchDataWithRetry(username, retries = 2) {
  try {
    const options = {
      method: 'POST',
      url: 'https://tiktok-unauthorized-api-scraper-no-watermark-analytics-feed.p.rapidapi.com/api/search_full',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': 'b38444b5b7mshc6ce6bcd5c9e446p154fa1jsn7bbcfb025b3b',
        'X-RapidAPI-Host': 'tiktok-unauthorized-api-scraper-no-watermark-analytics-feed.p.rapidapi.com'
      },
      data: {
        username: `@${username}`,
        amount_of_posts: 10
      }
    };

    const response = await axios.request(options);
    const posts = response.data.posts.map(post => {
      const playLinks = post.play_links;
      if (playLinks.length > 0) {
        return playLinks[0]; 
      } else {
        return null;
      }
    });

    return posts.filter(post => post !== null); 
  } catch (error) {
    console.error(error);
    if (retries > 0) {
      console.log(`Retrying... (${retries} retries left)`);
      return fetchDataWithRetry(username, retries - 1);
    } else {
      throw new Error('Max retries exceeded');
    }
  }
}
app.get('/', (req, res) => {
  res.send('tiktok');
});
app.get('/kshitiz', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Username parameter is missing' });
    }

    let posts = await fetchDataWithRetry(username);
    if (!posts || posts.length === 0) {
      posts = await fetchDataWithRetry(username);
    }

    const responseData = {
      user: username,
      posts: posts
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

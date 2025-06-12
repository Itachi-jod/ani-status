const express = require('express');
const axios = require('axios');
const shuffle = require('lodash.shuffle');

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
        amount_of_posts: 100
      }
    };

    const response = await axios.request(options);

    if (!response.data.posts || !Array.isArray(response.data.posts)) {
      throw new Error("Invalid API response format");
    }

    const posts = response.data.posts
      .map(post => post.play_links?.[0])
      .filter(url => url);

    return posts;
  } catch (error) {
    console.error("Error in fetchDataWithRetry:", error.message);

    if (retries > 0) {
      return fetchDataWithRetry(username, retries - 1);
    } else {
      throw new Error('Max retries exceeded');
    }
  }
}

app.get('/', (req, res) => {
  res.send('tiktok');
});

app.get('/itachi', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Username parameter is missing' });
    }

    let posts = await fetchDataWithRetry(username);
    if (!posts || posts.length === 0) {
      return res.status(404).json({ error: 'No videos found for this user' });
    }

    const randomPost = shuffle(posts)[0]; // pick one random video
    res.json({
      user: username,
      url: randomPost
    });
  } catch (error) {
    console.error("Error in /itachi route:", error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

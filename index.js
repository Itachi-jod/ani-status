require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
// Optional: Uncomment to enable rate limiting
// const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());

// Optional: Rate limiting middleware (uncomment to enable)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

async function fetchDataWithRetry(username, retries = 2) {
  try {
    const options = {
      method: 'POST',
      url: 'https://tiktok-unauthorized-api-scraper-no-watermark-analytics-feed.p.rapidapi.com/api/search_full',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tiktok-unauthorized-api-scraper-no-watermark-analytics-feed.p.rapidapi.com'
      },
      data: {
        username: `@${username}`,
        amount_of_posts: 100
      }
    };

    const response = await axios.request(options);

    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid API response: No data received');
    }

    if (!response.data.posts || !Array.isArray(response.data.posts)) {
      throw new Error(`Invalid API response: No posts found for username ${username}`);
    }

    const posts = response.data.posts
      .map(post => {
        if (!post.play_links || !Array.isArray(post.play_links) || !post.play_links[0]) {
          return null;
        }
        const url = post.play_links[0];
        if (!url.startsWith('http')) {
          return null;
        }
        return url;
      })
      .filter(url => url);

    if (posts.length === 0) {
      throw new Error(`No valid video URLs found for username ${username}`);
    }

    return posts;
  } catch (error) {
    console.error(`Error fetching data for username ${username}:`, error.message);

    if (error.response && error.response.status === 429) {
      console.error('Rate limit exceeded');
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchDataWithRetry(username, retries - 1);
      } else {
        throw new Error('API rate limit exceeded');
      }
    }

    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchDataWithRetry(username, retries - 1);
    } else {
      throw new Error(`Max retries exceeded for username ${username}: ${error.message}`);
    }
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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

    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }

    let posts = await fetchDataWithRetry(username);
    if (!posts || posts.length === 0) {
      return res.status(404).json({ error: 'No videos found for this user' });
    }

    const randomPost = shuffleArray(posts)[0];
    res.json({
      user: username,
      url: randomPost
    });
  } catch (error) {
    console.error(`Error in /itachi route for username ${req.query.username || 'unknown'}:`, error.message);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

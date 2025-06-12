/**
 * @author Lord Itachi
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const RAPIDAPI_HOST = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
const RAPIDAPI_KEY = '3641222daamsh414c9dca6784a8ep1f9b60jsn92b32450ebbf';

const userId = '7024281421016237058'; // TikTok user ID for kshitizgrxy

let videoList = [];
let currentIndex = 0;

async function fetchVideos() {
  const url = `https://${RAPIDAPI_HOST}/user/id/${userId}/videos`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI responded with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.videos || !Array.isArray(data.videos)) {
      throw new Error('No videos found in API response');
    }

    videoList = data.videos;
    currentIndex = 0;
    console.log(`Fetched ${videoList.length} videos for userId ${userId}`);
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    videoList = [];
  }
}

app.get('/', (req, res) => {
  res.send(`TikTok videos fetcher API for userId ${userId}. Use /video to get videos one by one.`);
});

app.get('/video', async (req, res) => {
  if (videoList.length === 0) {
    await fetchVideos();
    if (videoList.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch videos or no videos available.' });
    }
  }

  if (currentIndex >= videoList.length) {
    return res.json({ message: 'No more videos available.' });
  }

  const video = videoList[currentIndex];
  currentIndex++;

  // Return video info: you can customize fields based on actual API response
  res.json({
    id: video.id,
    description: video.description || '',
    videoUrl: video.video_url || video.play_addr || '',
    createTime: video.create_time || '',
    authorName: video.author_name || '',
    authorId: video.author_id || '',
    remainingVideos: videoList.length - currentIndex
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

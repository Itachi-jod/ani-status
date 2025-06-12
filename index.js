import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const RAPIDAPI_HOST = 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com';
const RAPIDAPI_KEY = '3641222daamsh414c9dca6784a8ep1f9b60jsn92b32450ebbf';

const userId = '7024281421016237058';

let videoList = [];
let currentIndex = 0;

// Fetch videos from RapidAPI
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

// Root route: sample video URLs
app.get('/', (req, res) => {
  res.json({
    sample: [
      "https://v16-webapp.tiktok.com/video1.mp4",
      "https://v16-webapp.tiktok.com/video2.mp4",
      "https://v16-webapp.tiktok.com/video3.mp4"
    ]
  });
});

// Route to get one video at a time
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

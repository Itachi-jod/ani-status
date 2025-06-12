import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const rapidHost = "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com";
const rapidKey = "3641222daamsh414c9dca6784a8ep1f9b60jsn92b32450ebbf";

const cache = {}; // { username: { index: 0, videos: [...] } }

async function getUserId(username) {
  const url = `https://${rapidHost}/user/profile/${username}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": rapidHost,
      "x-rapidapi-key": rapidKey
    }
  });
  const data = await res.json();
  return data?.data?.id || null;
}

async function fetchVideosForUser(userId) {
  const url = `https://${rapidHost}/user/posts/${userId}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-host": rapidHost,
      "x-rapidapi-key": rapidKey
    }
  });
  const data = await res.json();
  return (data?.data || []).map(v => ({
    id: v.id,
    desc: v.desc,
    videoUrl: v.video?.downloadAddr
  })).filter(v => v.videoUrl);
}

app.get("/:username", async (req, res) => {
  const username = req.params.username.toLowerCase();

  if (!cache[username]) {
    try {
      const userId = await getUserId(username);
      if (!userId) return res.json({ error: "Invalid username or user not found." });

      const videos = await fetchVideosForUser(userId);
      if (!videos.length) return res.json({ error: "No videos found for this user." });

      cache[username] = { index: 0, videos };
    } catch (err) {
      return res.json({ error: "Failed to fetch videos." });
    }
  }

  const userData = cache[username];
  const video = userData.videos[userData.index];
  userData.index = (userData.index + 1) % userData.videos.length;
  res.json(video);
});

app.get("/", (req, res) => {
  res.send("Welcome to TikTok Video API ! Use /<username> to get videos.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

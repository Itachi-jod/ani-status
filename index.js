import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());

const username = "kshitizgrxy";
let videoUrls = [];
let currentIndex = 0;

async function scrapeVideoUrls(username) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const url = `https://www.tiktok.com/@${username}`;
  await page.goto(url, { waitUntil: "networkidle2" });

  const urls = await page.evaluate(() => {
    try {
      const anchors = Array.from(document.querySelectorAll("a[href*='/video/']"));
      const uniqueUrls = [...new Set(anchors.map(a => a.href))];
      return uniqueUrls;
    } catch {
      return [];
    }
  });

  await browser.close();
  return urls;
}

app.get("/", async (req, res) => {
  try {
    if (videoUrls.length === 0) {
      videoUrls = await scrapeVideoUrls(username);
      currentIndex = 0;
      if (videoUrls.length === 0) {
        return res.status(404).json({ error: "No videos found." });
      }
    }

    const videoUrl = videoUrls[currentIndex];
    currentIndex = (currentIndex + 1) % videoUrls.length;

    res.json({ url: videoUrl });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch videos." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TikTok video URL fetcher API running on port ${PORT}`);
});

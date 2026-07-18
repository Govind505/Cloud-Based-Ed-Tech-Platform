const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const videos = [
  { id: 1, title: "React Basics", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { id: 2, title: "Python Intro", url: "https://www.w3schools.com/html/movie.mp4" }
];

app.get("/api/videos", (req, res) => res.json(videos));

app.get("/api/videos/:id", (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  res.json(video);
});

app.post("/api/login", (req, res) => {
  res.json({ token: "demo-token", user: "Adi" });
});

app.listen(5000, () => console.log("Backend running on port 5000"));
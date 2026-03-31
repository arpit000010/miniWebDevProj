const express = require("express");
const app = express();

app.use(express.json());

let posts = [];
let nextId = 1;

app.post("/posts", (req, res) => {
  const { title, content } = req.body;

  // validation
  if (!title || !content) {
    return res.status(400).json({
      error: "Title and content are required",
    });
  }

  const post = {
    id: nextId++,
    title,
    content,
    createdAt: new Date().toISOString(),
  };

  posts.push(post);

  res.status(201).json(post);
});

app.get("/posts", (req, res) => {
  res.status(200).json(posts);
});

app.get("/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({
      error: "Post not found",
    });
  }

  res.status(200).json(post);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

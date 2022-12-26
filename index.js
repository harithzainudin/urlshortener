require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const body_parser = require('body-parser');
const uuid = require('uuid');
const axios = require('axios');

// Setting up body-parser
app.use(body_parser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

app.use(function middleware(req, res, next) {
  next();
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Setting up MongoDB
mongoose.connect(process.env.MONGODB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });

// Creating schema
const short_url_schema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true}
});

const ShortUrl = mongoose.model("ShortUrl", short_url_schema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  const doc = await getDoc(req.params.short_url);
  if (doc) {
    res.redirect(doc.original_url);
  } else {
    res.json({ error: "Short URL not found" });
  }
});

app.post('/api/shorturl', async function(req, res) {
  const body = req.body;
  const id = uuid.v4();
  try {
    await checkUrl(body.url);
    await createDoc(body.url, id);
    res.json({ original_url: body.url, short_url: id });
  } catch (e) {
    res.json({ error: "invalid url" });
  }
});

async function checkUrl(url) {
  await axios.get(url);
}

async function createDoc(original_url, short_url) {
  const res = await ShortUrl.create({
    original_url: original_url,
    short_url: short_url,
  });
  console.log("Create Doc response = ", res);
}

async function getDoc(short_url) {
  const res = await ShortUrl.findOne({ short_url: short_url }).exec();
  console.log("Get Doc Response = ", res);
  return res;
}

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

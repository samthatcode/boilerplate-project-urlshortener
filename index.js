require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const validUrl = require('valid-url');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
});

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});

// Define URL schema and model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
const URL = mongoose.model("URL", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;

  if (!validUrl.isWebUri(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  let urlInDB = await URL.findOne({ original_url: originalUrl });

  if (urlInDB) {
    res.json({
      original_url: urlInDB.original_url,
      short_url: urlInDB.short_url
    });
  } else {
    const count = await URL.countDocuments({});
    const newUrl = new URL({
      original_url: originalUrl,
      short_url: count + 1
    });

    await newUrl.save();

    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url
    });
  }
});


app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortUrl = req.params.short_url;
  const urlInDB = await URL.findOne({ short_url: Number(shortUrl) });

  if (urlInDB) {
    res.redirect(urlInDB.original_url);
  } else {
    res.json({error:"invalid url"});
  }
});



// App listen
app.listen(process.env.PORT || 3000, function () {
  console.log(`Listening on port ${process.env.PORT || 3000}`);
});
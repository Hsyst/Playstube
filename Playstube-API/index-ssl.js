const https = require('https');
const express = require('express');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const natural = require('natural');
const Fuse = require('fuse.js');
const cors = require('cors');
const crypto = require('crypto');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const dir = './database';
const configadjust = 0.3;

const db = new sqlite3.Database('./database.db');

moment.locale('pt-br');


const privateKey = fs.readFileSync(path.join('CHAVE_PRIVADA_AQUI'), 'utf8');
const certificate = fs.readFileSync(path.join('CERTIFICADO_AQUI'), 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Criação das tabelas no banco de dados (se não existirem)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      desc TEXT,
      key TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      desc TEXT,
      videoFile TEXT,
      channel_name TEXT,
      createdIn TEXT,
      createdAt TEXT,
      FOREIGN KEY (channel_name) REFERENCES channels(name)
    )
  `);
});

let channels = {};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use('/database', express.static(path.join(__dirname, 'database')));
app.use('/', express.static(path.join(__dirname, 'html')));

// Função para carregar dados do banco de dados
async function loadDatabase() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM channels', [], (err, rows) => {
      if (err) reject(err);
      channels = {};
      rows.forEach((channel) => {
        channels[channel.name] = channel;
      });
      resolve();
    });
  });
}

function extractVideoReference(content) {
  const match = content.match(/video-refer:\s*(.+\.mp4)/);
  return match ? match[1].trim() : null;
}

function parseConfig(content) {
  const lines = content.split('\n');
  const config = {};
  for (const line of lines) {
    const [key, value] = line.split(':').map(item => item.trim());
    if (key && value) {
      if (key === 'name') config.name = value;
      if (key === 'desc') config.desc = value;
      if (key === 'channel') config.channel = value;
    }
  }
  return config.name && config.desc ? config : null;
}

function lemmatizeText(text) {
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());
  const stemmer = natural.PorterStemmer;
  return words.map(word => stemmer.stem(word)).join(' ');
}

function search(query) {
  const lemmatizedQuery = lemmatizeText(query);
  const options = {
    includeScore: true,
    keys: ['name', 'desc', 'channel'],
    threshold: configadjust,
  };
  const fuse = new Fuse(Object.values(channels), options);
  return fuse.search(lemmatizedQuery);
}

app.use(async (req, res, next) => {
  try {
    await loadDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar a database', details: error.message });
  }
});

app.get('/add-channel', (req, res) => {
  const { name, desc } = req.query;
  if (!name || !desc) {
    return res.status(400).json({ error: 'Faltando parâmetros (name, desc)' });
  }
  if (channels[name]) {
    return res.status(400).json({ error: 'Canal já existe' });
  }
  const key = crypto.randomBytes(16).toString('hex');
  db.run('INSERT INTO channels (name, desc, key) VALUES (?, ?, ?)', [name, desc, key], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar canal', details: err.message });
    }
    channels[name] = { name, desc, key, id: this.lastID };
    res.json({ message: 'Canal criado com sucesso', key });
  });
});

app.get('/add-video', async (req, res) => {
  const { nameofchannel, name, desc, local, key } = req.query;
  if (!nameofchannel || !name || !desc || !local || !key) {
    return res.status(400).json({ error: 'Faltando parâmetros (nameofchannel, name, desc, local, key)' });
  }
  const channel = channels[nameofchannel];
  if (!channel || channel.key !== key) {
    return res.status(403).json({ error: 'Canal inexistente ou chave inválida' });
  }

  const videoFileName = path.basename(local);
  const videoFilePath = path.join(dir, videoFileName);
  try {
    await fs.copyFile(local, videoFilePath);
    const txtFileName = `${name.replace(/\s/g, '-')}.txt`;
    const txtFilePath = path.join(dir, txtFileName);
    const txtContent = `name: ${name}\ndesc: ${desc}\nvideo-refer: ${videoFileName}`;
    await fs.writeFile(txtFilePath, txtContent);

    const createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
    const createdIn = moment().fromNow();

    db.run('INSERT INTO videos (name, desc, videoFile, channel_name, createdIn, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [name, desc, videoFileName, nameofchannel, createdIn, createdAt], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao adicionar vídeo', details: err.message });
        }
        res.json({ message: 'Vídeo adicionado com sucesso', videoFile: videoFileName });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar vídeo', details: error.message });
  }
});

app.post('/add-video-file', upload.single('video'), async (req, res) => {
  const { nameofchannel, name, desc, key } = req.body;
  if (!nameofchannel || !name || !desc || !key) {
    return res.status(400).json({ error: 'Faltando parâmetros (nameofchannel, name, desc, key)' });
  }
  const channel = channels[nameofchannel];
  if (!channel || channel.key !== key) {
    return res.status(403).json({ error: 'Canal inexistente ou chave inválida' });
  }

  const videoFileName = req.file.filename;
  const createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
  const createdIn = moment().fromNow();

  db.run('INSERT INTO videos (name, desc, videoFile, channel_name, createdIn, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [name, desc, videoFileName, nameofchannel, createdIn, createdAt], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao adicionar vídeo', details: err.message });
      }
      res.json({ message: 'Vídeo adicionado com sucesso', videoFile: videoFileName });
  });
});

app.get('/get-videos', (req, res) => {
  const { ofchannel } = req.query;
  const sql = ofchannel ?
    'SELECT * FROM videos WHERE channel_name = ? ORDER BY createdAt DESC' :
    'SELECT * FROM videos ORDER BY createdAt DESC';

  db.all(sql, ofchannel ? [ofchannel] : [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter vídeos', details: err.message });
    }
    res.json({ videos: rows.map(row => {
      const timeDiff = moment().diff(moment(row.createdAt), 'seconds');
      let timeString = '';
      if (timeDiff < 60) {
        timeString = `${timeDiff} segundo(s)`;
      } else if (timeDiff < 3600) {
        timeString = `${Math.floor(timeDiff / 60)} minuto(s)`;
      } else {
        timeString = moment(row.createdAt).fromNow();
      }
      return {
        videoFile: row.videoFile,
        name: row.name,
        description: row.desc,
        channel: row.channel_name,
        createdIn: timeString,
        createdAt: moment(row.createdAt).format('YYYY-MM-DD HH:mm:ss')
      };
    }) });
  });
});

app.get('/query-videos', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta o parâmetro de pesquisa (query)' });
  }
  const results = search(query).map(result => ({
    videoFile: result.item.videoFile,
    name: result.item.name,
    description: result.item.desc,
    channel: result.item.channel,
    createdIn: result.item.createdIn,
    createdAt: result.item.createdAt,
  }));
  res.json({ results });
});

app.get('/get-channels', (req, res) => {
  db.all('SELECT name, desc FROM channels', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao obter canais', details: err.message });
    }
    res.json({ channels: rows });
  });
});

//app.listen(PORT, () => {
//  console.log(`Servidor rodando em http://localhost:${PORT}`);
//});

https.createServer(credentials, app).listen(PORT, () => {
  console.log(`Servidor HTTPS rodando em https://localhost:${PORT}`);
});

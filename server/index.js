require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { discoverFiles, parseFile, buildGraph } = require('./parser');

const app = express();
const PORT = process.env.PORT || 18791;
const SIGNAL_GRAPH_ROOT = process.env.SIGNAL_GRAPH_ROOT || path.join(__dirname, '../../');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

let cachedGraph = null;
let lastParseTime = 0;
const CACHE_TTL = 30000; // 30 seconds

async function getGraph() {
  const now = Date.now();
  if (cachedGraph && (now - lastParseTime < CACHE_TTL)) {
    return cachedGraph;
  }

  console.log(`[${new Date().toISOString()}] Parsing memory at: ${SIGNAL_GRAPH_ROOT}`);
  const files = await discoverFiles(SIGNAL_GRAPH_ROOT);
  const allParsed = files.map(f => {
    try {
      return parseFile(f, SIGNAL_GRAPH_ROOT);
    } catch (err) {
      console.error(`Failed to parse ${f}: ${err.message}`);
      return { nodes: [], links: [] };
    }
  });

  cachedGraph = buildGraph(allParsed);
  lastParseTime = now;
  return cachedGraph;
}

app.get('/api/graph', async (req, res) => {
  try {
    const graph = await getGraph();
    res.json(graph);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/source', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Missing path' });

  const fullPath = path.resolve(SIGNAL_GRAPH_ROOT, filePath);
  // Security check: ensure path is within root
  if (!fullPath.startsWith(SIGNAL_GRAPH_ROOT)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const content = require('fs').readFileSync(fullPath, 'utf8');
    res.send(content);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

app.listen(PORT, () => {
  console.log(`SignalGraph server running on http://127.0.0.1:${PORT}`);
  console.log(`Root directory: ${SIGNAL_GRAPH_ROOT}`);
});

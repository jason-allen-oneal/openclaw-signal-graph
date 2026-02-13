const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');

/**
 * Discovers markdown files in the given root directory.
 */
async function discoverFiles(root) {
  const patterns = ['**/*.md'];
  const files = await glob(patterns, { cwd: root, absolute: true });
  return files;
}

/**
 * Parses a single markdown file for concepts, tags, and headers.
 */
function parseFile(filePath, root) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(root, filePath);
  
  const nodes = [];
  const links = [];

  // 1. File node
  const fileId = `file:${relativePath}`;
  nodes.push({
    id: fileId,
    type: 'file',
    label: relativePath,
    path: relativePath
  });

  // 2. Extract wikilinks [[Concept]]
  const wikilinkRegex = /\[\[(.*?)\]\]/g;
  let match;
  while ((match = wikilinkRegex.exec(content)) !== null) {
    const concept = match[1].trim();
    const conceptId = `concept:${concept}`;
    
    nodes.push({
      id: conceptId,
      type: 'concept',
      label: concept
    });

    links.push({
      source: fileId,
      target: conceptId,
      type: 'contains'
    });
  }

  // 3. Extract tags #tag
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_-]+)/g;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1].trim();
    const tagId = `tag:${tag}`;

    nodes.push({
      id: tagId,
      type: 'tag',
      label: `#${tag}`
    });

    links.push({
      source: fileId,
      target: tagId,
      type: 'tagged'
    });
  }

  // 4. Extract headers ## Header
  const headerRegex = /^##\s+(.*)$/gm;
  while ((match = headerRegex.exec(content)) !== null) {
    const header = match[1].trim();
    const headerId = `event:${relativePath}#${header}`;

    nodes.push({
      id: headerId,
      type: 'event',
      label: header,
      source: relativePath
    });

    links.push({
      source: fileId,
      target: headerId,
      type: 'header'
    });
  }

  return { nodes, links };
}

/**
 * Generates the full graph from a list of files.
 */
function buildGraph(allParsed) {
  const nodeMap = new Map();
  const links = [];

  for (const data of allParsed) {
    for (const node of data.nodes) {
      // Deduplicate nodes (concepts and tags may appear in many files)
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
      }
    }
    links.push(...data.links);
  }

  // Timeline links between daily logs
  // Daily logs are usually YYYY-MM-DD.md
  const dailyLogs = [...nodeMap.values()]
    .filter(n => n.type === 'file' && /^\d{4}-\d{2}-\d{2}\.md$/.test(path.basename(n.path)))
    .sort((a, b) => a.label.localeCompare(b.label));

  for (let i = 0; i < dailyLogs.length - 1; i++) {
    links.push({
      source: dailyLogs[i].id,
      target: dailyLogs[i+1].id,
      type: 'timeline'
    });
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links
  };
}

module.exports = {
  discoverFiles,
  parseFile,
  buildGraph
};

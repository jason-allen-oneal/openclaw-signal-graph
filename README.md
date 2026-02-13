# SignalGraph

An OpenClaw memory visualizer. SignalGraph parses markdown memory files to build a graph of decisions, concepts, and continuity nodes.

## Features

- **Entity Extraction**: Automatically extracts wikilinks `[[Concept]]`, tags `#tag`, and headers `## Header`.
- **Force-Directed Graph**: Interactive D3.js visualization.
- **Source Inspection**: Click any node to view the original markdown source in a side panel.
- **Universal**: Point it at any directory of markdown files.

## Install

```bash
cd signal-graph
npm install
```

## Run

```bash
# Set the root directory for scanning
export SIGNAL_GRAPH_ROOT=/path/to/your/markdown/files

npm start
```

Open: http://localhost:18791

## Configuration

- `PORT`: Server port (default: 18791).
- `SIGNAL_GRAPH_ROOT`: Root directory for markdown discovery.

## License

MIT

# Corex WebUI

<div align="center">
  <img alt="Corex Logo" src="https://i.ibb.co/R4dv03NB/Corex-512.png" width="256" height="256">

**A minimalistic WebUI for self-hosted AI.**<br>

[![Discord](https://img.shields.io/discord/1391770662028447815?label=Discord&logo=Discord&logoColor=white&style=for-the-badge)](https://discord.gg/zs6u4TD8MX)
[![Ollama](https://img.shields.io/badge/Ollama-white?style=for-the-badge)](https://ollama.com/)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge)
![Github license](https://img.shields.io/github/license/hevnee/corex-webui?style=for-the-badge&cacheSeconds=300)
![Github last commit](https://img.shields.io/github/last-commit/hevnee/corex-webui?style=for-the-badge&cacheSeconds=300)

</div>

## Overview

Corex is a powerful local WebUI for self-hosted AI, such as [Text generation web UI](https://github.com/oobabooga/text-generation-webui) and [Open WebUI](https://github.com/open-webui/open-webui).<br>

![Corex example gif](https://i.ibb.co/21LGSCJy/ezgif-8fb407f285bf72.gif)

## Features

- Supports only one local text generation backend, including Ollama (more will be added later).
- 100% offline and private, with zero telemetry, external resources, or remote update requests.
- Seamless integration with Ollama for local model execution
- Simple setup and configuration for beginners

## Installation

Follow these steps to get corex-llm-webui up and running:

```bash
# Clone repository
git clone https://github.com/yourusername/corex-llm-webui.git
cd corex-webui

# Install dependencies
pip install -r requirements.txt --upgrade

# Launch server
cd corex
python server.py
# You can also just run `server.py`

# Install random model
ollama pull llama3:8b
```

> [!NOTE]
> To use the AI model, replace `MODEL` in `config.py` with your model<br>
> For example: MODEL = "llama3:8b"

### Requirements:

- Python 3.8 or higher
- Ollama installed and configured
- At least 8GB VRAM for running LLMs locally

## Contributing

We welcome contributions! To get started:
1. Fork the repository
2. Create a new branch for your bug or feature
3. Commit your changes
4. Push to the Branch
5. Open a Pull Request

## License

Copyright © 2025 [hevnee](https://github.com/hevnee).<br/>
Corex is [MIT](https://choosealicense.com/licenses/mit) licensed.
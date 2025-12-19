# ChatGPT Atlas Automation

Automate ChatGPT Atlas desktop app (macOS) - browse websites and search automatically using natural language prompts.

## Features

- 🌐 **Smart URL Navigation** - Parses prompts and navigates directly to search results
- 🎯 **Top Sites** - Direct search for Amazon, YouTube, Flipkart, GitHub, etc.
- 🔍 **Universal Fallback** - Google site-search for ANY unknown website
- 📸 **Screenshots** - Captures results after each prompt
- 📁 **Timestamped Runs** - Each run saved separately

## Requirements

- macOS
- [ChatGPT Atlas](https://openai.com) desktop app installed
- Node.js

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/atlas-automation.git
cd atlas-automation

# Edit prompts
nano prompts.json

# Run
node connect_atlas.js
```

## Usage

Edit `prompts.json` with your browsing commands:

```json
{
  "prompts": [
    "Go to amazon.com and search for nike shoes under 100 dollars",
    "Open youtube.com and search for JavaScript tutorials",
    "Navigate to swiggy.com and find chicken biryani"
  ],
  "waitTimePerPrompt": 45000,
  "screenshotAfterEachPrompt": true
}
```

## How It Works

| Site Type | Method | Example URL |
|-----------|--------|-------------|
| Top sites (Amazon, YouTube, etc.) | DIRECT | `amazon.com/s?k=query` |
| All other sites | GOOGLE_SITE | `google.com/search?q=query+site:domain.com` |

## Output

Results saved to `atlas_trajectories/smart_YYYY-MM-DD_HH-MM-SS/`:
- `01_result.png` - Screenshot after each prompt
- `summary.json` - Run details and results
- `final.png` - Final state

## Permissions

Grant Accessibility permissions to your terminal:
**System Settings → Privacy & Security → Accessibility → Add Terminal/iTerm**

## License

MIT

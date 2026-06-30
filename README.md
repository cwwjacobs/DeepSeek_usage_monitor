# DeepSeek Usage Monitor

Standalone terminal UI for monitoring your DeepSeek API account balance and pricing.

```
┌──────────────────────────────────────────────────┐
│ DeepSeek Usage Monitor              Esc to quit  │
│                                                  │
│ Account Balance                                  │
│ $42.00                     (converted from CNY)  │
│                                                  │
│ Display Currency                                 │
│ ← USD ($) →                                      │
│                                                  │
│ DeepSeek V4 Pricing (per 1M tokens)              │
│ v4-pro:  cache $0.00  input $0.42  output $0.84 │
│ v4-flash: cache $0.00  input $0.14  output $0.28 │
│                                                  │
│ API key: sk-deep…                                │
│ ← → change currency  ·  auto-refreshes           │
└──────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Clone and install
git clone https://github.com/YOUR_USER/DeepSeek_usage_monitor.git
cd DeepSeek_usage_monitor
npm install

# Set your API key
export DEEPSEEK_API_KEY=sk-your-key-here

# Launch
npm start
```

Or run directly with tsx:

```bash
npx tsx cli.ts
```

## Requirements

- Node.js 18+
- DeepSeek API key (set via `DEEPSEEK_API_KEY` or `DEEPCODE_API_KEY` env var)

## Features

- **Live balance** — fetches your real DeepSeek account balance every 2 minutes
- **Multi-currency** — USD (default), CNY, EUR, GBP, JPY
- **Pricing reference** — DeepSeek V4 per-model pricing in your currency
- **Auto-refresh** — balance updates automatically
- **Currency persistence** — your choice is saved to `~/.deepseek-usage-monitor.json`

## Keyboard Controls

| Key | Action |
|---|---|
| `←` `→` | Cycle display currency |
| `Esc` | Quit |
| `Ctrl+C` | Quit |

## License

MIT

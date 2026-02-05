# Links

A minimal, self-hosted start page with a customizable clock and artwork display.

## Features

- **Quick Search** - Instantly search the web via DuckDuckGo
- **Customizable Clock** - Choose from 16 digital/cyberpunk-style fonts
- **Dynamic Artwork** - Display curated wallpapers with optional accent color matching
- **Remote Sync** - Optional sync server for multi-device access

## Quick Start

### Frontend Only

Simply open `index.html` in your browser, or serve it locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`

### With Sync Server

1. Start the sync server:

```bash
cd server/sync
dotnet run
```

2. Open the frontend and configure the sync server address in the settings menu.

## Docker

### Frontend

```bash
docker build -t links .
docker run -p 8080:80 links
```

### Sync Server

```bash
cd server/sync
docker build -t links-sync .
docker run -p 5000:8080 links-sync
```

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS (no build step, no framework)
- **Backend**: .NET 10 Minimal API
- **Fonts**: Google Fonts + DSEG7 for clock display

## License

MIT

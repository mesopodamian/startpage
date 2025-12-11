# Links

A minimal, self-hosted start page for managing bookmarks with a customizable clock and artwork display.

## Features

- **Bookmark Management** - Organize links into nested groups with drag-free simplicity
- **Quick Search** - Instantly filter bookmarks or search the web via DuckDuckGo
- **Keyboard Navigation** - Navigate and open links without touching the mouse
- **Customizable Clock** - Choose from 16 digital/cyberpunk-style fonts
- **Dynamic Artwork** - Display curated wallpapers with optional accent color matching
- **Import/Export** - Support for JSON and browser bookmark HTML files
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

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `.` | Browse all bookmarks |
| `Space` | Search the web |
| `Arrow Up/Down` | Navigate through links |
| `Enter` | Open selected link |
| `Ctrl + Enter` | Open in new tab |
| `Escape` | Close modals/menus |

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

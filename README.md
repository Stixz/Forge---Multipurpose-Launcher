# Forge Launcher — Quick Reference

A reusable, config-driven app launcher skeleton that runs as a stripped-down desktop window via Electron.

---

## File Overview

| File | Purpose |
|---|---|
| `index.html` | All UI structure — header, tile grid, settings modal |
| `styles/*.css` | Visual styling split by concern (theme, layout, components, utilities, animations) |
| `app.js` | All launcher logic — rendering, app editor, theming |
| `config.json` | Default apps and theme loaded at startup |
| `main.js` | Electron host — creates the window, handles IPC |
| `preload.js` | Secure bridge between the window and Electron |
| `package.json` | Project scripts and dependencies |

---

## Running It

Make sure you have [Node.js](https://nodejs.org) installed, then from the `C:\Forge` folder:

```powershell
# First time only — install Electron
npm install

# Launch the app
npm start
```

---

## Modifying via Settings (no code needed)

Click **Settings** in the top-right corner of the launcher window to:

- Rename the launcher title and subtitle
- Change the four theme colors live — Background 1, Background 2, Accent, and Text
- Add, edit, or delete app tiles — including a native file **Browse** button for local executables

Settings (including your apps and colors) are saved automatically when you click **Save**.

---

## Modifying `config.json` (default startup state)

`config.json` is loaded once when the launcher starts. It defines the default title, theme, and app list before any saved settings are applied.

### Change the default title or theme

```json
{
    "title": "My Launcher",
    "subtitle": "My custom subtitle",
    "theme": {
        "bg1": "#07111f",
        "bg2": "#0d2238",
        "accent": "#f5a524",
        "text": "#e8f3ff"
    }
}
```

- `bg1` / `bg2` — the two gradient background colors (hex)
- `accent` — used for glows, pills, and highlights
- `text` — main readable text color

### Add a web app

```json
{
    "name": "YouTube",
    "type": "web",
    "url": "https://youtube.com",
    "icon": "📺",
    "description": "Watch videos"
}
```

### Add a local executable

```json
{
    "name": "Notepad",
    "type": "local",
    "path": "C:/Windows/System32/notepad.exe",
    "args": "",
    "icon": "📝",
    "description": "Text editor"
}
```

Arguments are optional — leave `args` as `""` if not needed.

### Add a Steam game

```json
{
    "name": "Counter-Strike 2",
    "type": "steam",
    "id": "730",
    "icon": "🎯",
    "description": "Tactical shooter"
}
```

Find a Steam App ID at [steamdb.info](https://www.steamdb.info).

---

## Modifying Styles

The CSS variables in `styles/theme.css` control the overall look:

```css
:root {
    --bg-1: #07111f;
    --bg-2: #0d2238;
    --glass: rgba(255, 255, 255, 0.07);
    --line: rgba(255, 255, 255, 0.18);
    --text: #e8f3ff;
    --text-soft: #b8cbdd;
    --accent: #f5a524;
    --accent-2: #ffe3a2;
}
```

These are overridden at runtime by any colors you save in Settings, but editing them here changes the hard defaults.

---

## Modifying the Window Size

Open `main.js` and adjust the values in `createMainWindow()`:

```js
mainWindow = new BrowserWindow({
    width: 1120,   // starting width in pixels
    height: 760,   // starting height in pixels
    minWidth: 760,
    minHeight: 520,
    ...
});
```

---

## Building a Distributable (`.exe`)

To package the launcher as a standalone Windows executable, install **electron-builder**:

```powershell
npm install --save-dev electron-builder
```

Add a build script to `package.json`:

```json
"scripts": {
    "start": "electron .",
    "build": "electron-builder --win --dir"
}
```

Add a build config block to `package.json`:

```json
"build": {
    "appId": "com.forge.launcher",
    "productName": "Forge Launcher",
    "win": {
        "target": "nsis"
    },
    "files": [
        "index.html",
        "styles/",
        "app.js",
        "main.js",
        "preload.js",
        "config.json"
    ]
}
```

Then run:

```powershell
npm run build
```

The output installer will be in the `dist/` folder.

---

## Notes

- In the desktop Electron app, saved settings are encrypted and stored under the app's user data directory.
- Browser-only fallback mode uses `localStorage`.
- To fully reset in desktop mode, clear the app data folder under `%APPDATA%` for Forge.
- The **Browse** button in the App Editor only works in the Electron desktop build — not in a plain browser tab.

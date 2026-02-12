# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chiikawa Pet is an Electron desktop application that displays a draggable character pet on the desktop. The pet responds to keyboard input with different animations.

## Commands

- `npm start` - Run the application in development mode
- `npm run build` - Build distributable packages (outputs to `dist/`)

## Architecture

The application consists of two main files:

### Main Process (`main.js`)

- Creates a frameless, transparent, always-on-top BrowserWindow
- Uses `uiohook-napi` for global keyboard event monitoring
- Toggles between "interactive" and "passthrough" modes via Ctrl key:
  - Passthrough mode: Clicks pass through to underlying windows (immovable)
  - Interactive mode: Window is draggable
- Communicates key events to the renderer via IPC (`key-action` channel)

### Renderer (`index.html`)

- Displays the pet as a simple `<img>` element with `-webkit-app-region: drag`
- Listens for `key-action` IPC events to switch images based on key press:
  - Space/Enter: Shows `assets/action/mid.png`
  - Keys with keycode < 30: Shows `assets/action/left.png`
  - Other keys: Shows `assets/action/right.png`
  - Key release: Returns to `assets/idle/0.png`

### Assets

Images are stored in `assets/` directory:
- `assets/idle/0.png` - Default idle state
- `assets/action/left.png`, `mid.png`, `right.png` - Action states

## Key Dependencies

- **electron**: Desktop app framework
- **pixi.js**: Included but not currently used (intended for potential sprite/animation system)
- **uiohook-napi**: Global keyboard hook for system-wide key detection

## Window Configuration

- 300x300px, transparent background, frameless
- Always-on-top enabled
- Icon: `icon.ico` (taskbar and dock)
- `nodeIntegration: true` and `contextIsolation: false` for direct Node API access

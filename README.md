# Web Activity Playback Plugin

A Playback plugin for [**Multimodal Observer**](https://github.com/MultimodalObserver-2/mo) that visualizes web browsing activity events recorded during a session, synchronized with the session timeline.

## Features

- **Six event tabs**: keystrokes, mouse clicks, mouse moves, mouse selections, searches, and tab changes
- **Timeline synchronization** — filters events up to the current playback position
- **Scrollable tables** with all relevant fields per event type
- **Seek support** — updates instantly when the user seeks to any point in the session

## Supported Formats

- `.json`

The plugin accepts files produced by the [Web Browsing Activity Capture Plugin](../mo-plugin-capture-web-browsing-activity/).

## Configuration Options

This plugin has no configurable properties.

## How It Works

- Reads the session map file (`.json`) which contains the paths to each event type file.
- Loads each event file in parallel and stores all events in memory.
- On each timeline event (play, seek, sync), filters each event array to show only events up to the current playback position.
- Renders the filtered events as a scrollable table under the active tab.

## Installation

1. Download the latest plugin release.
2. Extract the downloaded `.zip` file.
3. Register the plugin using the plugin interface within Multimodal Observer.

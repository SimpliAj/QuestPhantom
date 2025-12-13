# <img src="https://i.imgur.com/PF8Tq4C.png" width="50" alt="QuestPhantom">  QuestPhantom 

Automate Discord Quests efficiently with this JavaScript script. 

## Overview

QuestPhantom is a developer console script that automatically completes Discord Quests. It supports various quest types and uses webpack injection for direct access to Discord's internal modules.

## Features

- 🎯 **Automatic Quest Processing**: Handles quests sequentially
- 📺 **Video Spoofing**: Emulates video watch progress
- 🎮 **Desktop App Integration**: Supports game launching on desktop
- 📱 **Mobile Support**: Works for mobile video quests as well
- 🔄 **Error Handling**: Robust processing with detailed logging

## Supported Quest Types

- `WATCH_VIDEO` - Video quests
- `WATCH_VIDEO_ON_MOBILE` - Mobile video quests
- `PLAY_ON_DESKTOP` - Desktop game quests
- `STREAM_ON_DESKTOP` - Stream quests
- `PLAY_ACTIVITY` - Activity quests

## Installation & Usage

1. Open Discord Desktop App (Windows `.exe` or macOS application)
2. Press `Ctrl+Shift+I` to open Developer Tools
3. Go to the **Console** tab
4. Copy the entire content of `main.js`
5. Paste it into the console and press Enter

The script will automatically process all active quests.
The user has to activate the quests him self then follow the Installation & Usage Guide

## Technical Details

The script accesses the following Discord internal modules:

- **ApplicationStreamingStore** - Stream data
- **RunningGameStore** - Running games
- **QuestsStore** - Quest information
- **ChannelStore** - Channel data
- **FluxDispatcher** - Event system
- **API** - Discord REST API

## Warning

⚠️ **Disclaimer**: This script uses undocumented Discord APIs. Use at your own risk. Discord reserves the right to suspend accounts for automation.

## License

Private - For personal use only

## Credits

This is an adapted version of [this gist](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb) by aamiaa.

## Troubleshooting

If the script doesn't work:
- Ensure you're using the Discord Desktop App (not web browser)
- Verify you're logged into Discord
- Check that quests are still active
- Look for errors in the Developer Tools Console




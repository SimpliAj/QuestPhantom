# <img src="https://i.imgur.com/PF8Tq4C.png" width="50" alt="QuestPhantom">  QuestPhantom

> **Automate Discord Quests efficiently** with this powerful JavaScript console script.

---

## 📋 Overview

QuestPhantom is a developer console script that automatically completes Discord Quests. It uses webpack injection to access Discord's internal modules, handling various quest types with sequential processing and robust error handling.

> [!NOTE]
> Browser-based limitations: Game-related quests won't work in the browser. Use the [Discord Desktop App](https://discord.com/download) for full functionality.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Sequential Processing** | Handles quests one at a time with proper state management |
| 📺 **Video Progress Spoofing** | Emulates video watch completion with realistic timestamps |
| 🎮 **Desktop Game Support** | Launches and completes game-related quests |
| 📱 **Mobile Quest Support** | Handles mobile video quest completion |
| 📊 **Detailed Logging** | JSON-formatted logs for each quest with progress tracking |
| 🔄 **Auto-Reward Redemption** | Automatically redeems completed quest rewards |

**Streaming Quests:** If your quest requires streaming, join a voice channel with a friend or alt account and stream any window.

---

## 🎯 Supported Quest Types

- **`WATCH_VIDEO`** - Video watching quests
- **`WATCH_VIDEO_ON_MOBILE`** - Mobile video quests
- **`PLAY_ON_DESKTOP`** - Desktop application game quests
- **`STREAM_ON_DESKTOP`** - Streaming requirement quests
- **`PLAY_ACTIVITY`** - Discord Activity quests

---

## 🚀 Installation & Usage

### Prerequisites
- Discord Desktop App ([Windows or macOS](https://discord.com/download))
- Developer Tools access
- Active Discord Quests

### Step-by-Step Guide

1. **Open Discord Desktop App** (not the web version)
2. **Open Developer Tools** by pressing `Ctrl+Shift+I` (Windows) or `Cmd+Option+I` (macOS)
3. **Navigate to the Console tab**
4. **Copy** the entire `main.js` file content
5. **Paste** into the console and press Enter
6. **Activate quests manually** - The script will then automatically process them

The script processes all enrolled quests sequentially and logs progress in real-time.

---

## 🤖 QuestHunter Discord Bot

QuestHunter is a Discord bot that complements QuestPhantom by sending notifications when new quests are detected in your server.

### Features
- 📬 **Auto-Notifications** - Sends alerts in a designated channel when new quests are detected
- ⚡ **Easy Setup** - Configure via simple slash commands
- 🔔 **Real-time Updates** - Instant notification of quest availability

### Installation

[**Invite QuestHunter to your Discord Server**](https://discord.com/oauth2/authorize?client_id=1474123878002462801&permissions=2147699712&integration_type=0&scope=bot)

Once invited, use slash commands to configure the bot and choose which channel receives quest notifications and get a spoofguide with a link for the latest main.js

---

## ⚙️ Technical Architecture

### Internal Discord Modules Used

| Module | Purpose |
|--------|---------|
| **ApplicationStreamingStore** | Manages stream data and state |
| **RunningGameStore** | Tracks active games |
| **QuestsStore** | Stores quest data and user progress |
| **ChannelStore** | Provides channel information |
| **GuildChannelStore** | Guild-specific channel data |
| **FluxDispatcher** | Discord's event system |
| **API Module** | REST API for quest progress updates |

### How It Works

1. Injects webpack to access Discord's internal stores
2. Retrieves all active, uncompleted quests from QuestsStore
3. Identifies supported quest types (WATCH_VIDEO, PLAY_ON_DESKTOP, etc.)
4. Processes quests sequentially with appropriate handlers
5. For video quests: simulates watch progress with realistic timestamps
6. Logs all actions with timestamps and progress metrics
7. Auto-redeems quest rewards upon completion

---

## ⚠️ Legal Notice

> [!WARNING]
> **Use at your own risk!**
> 
> This script uses undocumented Discord APIs and violates Discord's Terms of Service. Discord may suspend or ban accounts using automation. This tool is for educational purposes only. Use responsibly and at your own discretion.

---

## 📝 License

**Private** - For personal use only

---

## 👏 Credits

This is an adapted version of [the original script](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb) by **aamiaa**.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Script doesn't execute | Ensure you're using the **Discord Desktop App**, not the web version |
| Console shows errors | Verify you're **logged into Discord** and have active quests |
| Quests not detected | Check that quests are still **active** and not expired in your quest menu |
| Nothing happens | Look for error messages in the **Developer Tools Console** (red text) |
| API failures | Try closing/reopening Discord or running the script again |

---

## 📌 Notes

- Always **manually activate quests** in Discord before running the script
- The script runs **in the background** while the console is open
- **Keep Discord open** with the console running for the duration
- Quests are processed **one at a time** to avoid rate limiting
- Logs are printed to the console in JSON format for debugging







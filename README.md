# Meeting Insights Agent

> Intelligent Slack agent that transforms how teams capture, track, and act on meeting outcomes — automatically.

<p align="center">
  <img src="https://img.shields.io/badge/Slack-Bolt%20Framework-4A154B?style=flat-square&logo=slack" alt="Slack Bolt">
  <img src="https://img.shields.io/badge/AI-Groq%20LLaMA%203.3%2070B-F97316?style=flat-square" alt="Groq AI">
  <img src="https://img.shields.io/badge/Slack-Real%u2013Time%20Search%20API-611F69?style=flat-square" alt="Slack Search API">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Hackathon-Slack%20Agent%20Builder%20Challenge-blue?style=flat-square" alt="Hackathon">
</p>

---

## The Problem

Every day, millions of meetings happen across Slack channels. Decisions are made, action items are assigned, and commitments are given — only to be lost in the noise of message history.

- **70%** of action items from meetings are never tracked
- Teams spend **5+ hours/week** searching for past decisions
- No one remembers who promised to do what by when

Meeting Insights Agent solves this by **automatically capturing, summarizing, and tracking** everything that matters from your Slack conversations.

---

## Features

### `/meeting-summary` — Instant AI Meeting Summaries
Generates a structured summary from any channel's message history, including:
- Meeting overview (3-4 line summary)
- Action items with assignees and deadlines
- Key decisions made
- Pending questions that need answers

### `/action-items` — Extract Action Items
Scans channel messages and extracts every action item, commitment, and task — formatted as a clear checklist with owners and deadlines.

### `@Meeting Insights Agent` — Intelligent Q&A
Mention the bot with any question about your channel's history:
- *"What was decided about the payment gateway?"*
- *"Who has pending tasks this week?"*
- *"Summarize last week's design review"*

The bot searches through channel history and provides AI-powered answers with context.

### Auto-Action Item Detection
The bot **proactively monitors** every message in real-time. When someone writes a commitment like:
- *"I'll fix the auth bug by Friday"*
- *"Action item: database migration by Wednesday"*

The bot instantly detects it and posts a tracked action item card — so nothing slips through the cracks.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│              SLACK WORKSPACE (UI Layer)              │
│  /meeting-summary  │  /action-items  │  @mention     │
└──────────────────────┬───────────────────────────────┘
                       │ Socket Mode (WebSocket)
┌──────────────────────▼───────────────────────────────┐
│           BOLT FRAMEWORK (Event Processing)          |
│  Slash Commands  │  Event Listeners  │  Web API      │
└──────────────────────┬───────────────────────────────┘
                       │ REST API Calls
┌──────────────────────▼───────────────────────────────┐
│            AI PROCESSING (Groq LLM)                  │
│  LLaMA 3.3 70B  │  Real-Time Search API              │
└──────────────────────┬───────────────────────────────┘
                       │ Read / Write
┌──────────────────────▼───────────────────────────────┐
│                 DATA LAYER                           │
│  Channel Messages  │  User Profiles  │  Action Items │
└──────────────────────────────────────────────────────┘
```

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| **Slack Bolt Framework** | App framework, event handling, Socket Mode |
| **Slack Web API** | `conversations.history`, `users.info` |
| **Slack Real-Time Search API** | Message search & context retrieval |
| **Groq AI (LLaMA 3.3 70B)** | Summarization, action extraction, Q&A |
| **Node.js** | Runtime environment |
| **Socket Mode** | Persistent WebSocket connection |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Slack workspace
- Groq API key ([Get one free](https://console.groq.com/keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/svk8190/meeting-insights-agent.git
cd meeting-insights-agent

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your tokens
```

### Environment Variables

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
OPENAI_API_KEY=gsk-your-groq-key
PORT=3000
```

### Slack App Setup

1. Create a new app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable **Socket Mode** and generate an App-Level Token
3. Add these **Bot Token Scopes**:
   - `chat:write`, `channels:history`, `channels:read`
   - `users:read`, `app_mentions:read`
4. Create slash commands: `/meeting-summary`, `/action-items`
5. Subscribe to events: `app_mention`, `message.channels`
6. Install the app to your workspace

### Run Locally

```bash
node app.js
```

---

## Demo

### /meeting-summary in action
User types `/meeting-summary` → Bot analyzes channel messages → Returns structured summary with action items, decisions, and pending questions.

### Auto-detection in action
User writes: *"I'll complete the API integration by Monday"* → Bot instantly posts:
> 📋 **Action Item Detected!**
> • Complete API integration
> • Assignee: @user
> • _I'll track this for you!_

---

## Impact

Meeting Insights Agent addresses a universal workplace problem:

- **Time Saved:** Teams save 5+ hours/week previously spent searching for meeting outcomes
- **Accountability:** Every commitment is automatically tracked — nothing falls through the cracks
- **Accessibility:** Natural language interface means anyone can use it without training
- **Real-time:** Action items are detected the moment they're written

---

## Project Track

**New Slack Agent** — Building a new Slack agent that automates workflows and surfaces intelligent insights.

---

## Future Roadmap

- [ ] Jira/Trello integration via MCP Server for auto-ticket creation
- [ ] Weekly automated digest emails with pending action items
- [ ] Multi-channel search and cross-team insights
- [ ] Custom reminder scheduling for detected action items
- [ ] Slack Marketplace listing for enterprise distribution

---

## Author

**svk8190** — Built for the [Slack Agent Builder Challenge](https://devpost.com/hackathons/slack-agent-builder-challenge)

---

## License

MIT

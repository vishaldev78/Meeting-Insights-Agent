const { App } = require('@slack/bolt');
const dotenv = require('dotenv');
const OpenAI = require('openai');
dotenv.config();

// ===== SLACK APP INIT =====
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// ===== GROQ INIT (using OpenAI SDK) =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const AI_MODEL = 'llama-3.3-70b-versatile';

// ===== HELPER: Get channel messages =====
async function getChannelMessages(client, channelId, limit = 50) {
  try {
    const result = await client.conversations.history({
      channel: channelId,
      limit: limit,
    });
    return result.messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// ===== HELPER: Get user name =====
async function getUserName(client, userId) {
  try {
    const result = await client.users.info({ user: userId });
    return result.user?.real_name || result.user?.name || 'unknown';
  } catch {
    return 'user';
  }
}

// ===== COMMAND: /meeting-summary =====
app.command('/meeting-summary', async ({ command, ack, respond, client }) => {
  await ack();
  await respond('🔍 Analyzing meeting messages...');

  try {
    const messages = await getChannelMessages(client, command.channel_id, 50);
    
    if (messages.length === 0) {
      await respond('📭 No messages found in this channel.');
      return;
    }

    const formattedMessages = [];
    for (const msg of messages.slice(0, 30)) {
      if (msg.subtype) continue;
      const name = await getUserName(client, msg.user);
      formattedMessages.push(`[${name}]: ${msg.text}`);
    }

    const messageContext = formattedMessages.join('\n');

    const aiResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a Meeting Insights Agent for Slack. Analyze the channel messages and provide:
1. 📝 Meeting Summary (3-4 lines)
2. ✅ Action Items (who said what, what needs to be done)
3. 🎯 Key Decisions
4. ❓ Pending Questions

Keep the format clean and readable.`
        },
        {
          role: 'user',
          content: `Here are the recent channel messages:\n\n${messageContext}\n\nCreate a meeting summary from these.`
        }
      ],
      temperature: 0.3,
    });

    const summary = aiResponse.choices[0].message.content;

    await respond({
      text: summary,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📋 Meeting Summary' }
        },
        { type: 'divider' },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: summary }
        },
        { type: 'divider' },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `✅ ${formattedMessages.length} messages analyzed | Powered by Slack AI + Groq` }
          ]
        }
      ]
    });

  } catch (error) {
    console.error('Error:', error);
    await respond(`❌ Error: ${error.message}`);
  }
});

// ===== COMMAND: /action-items =====
app.command('/action-items', async ({ command, ack, respond, client }) => {
  await ack();
  await respond('🎯 Searching for action items...');

  try {
    const messages = await getChannelMessages(client, command.channel_id, 30);

    if (messages.length === 0) {
      await respond('📭 No messages found.');
      return;
    }

    const formattedMessages = [];
    for (const msg of messages.slice(0, 20)) {
      if (msg.subtype) continue;
      const name = await getUserName(client, msg.user);
      formattedMessages.push(`[${name}]: ${msg.text}`);
    }

    const messageContext = formattedMessages.join('\n');

    const aiResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Extract action items from Slack messages. Format:
☐ @username - task description (deadline if mentioned)

Only extract genuine action items, don't speculate.`
        },
        {
          role: 'user',
          content: messageContext
        }
      ],
      temperature: 0.2,
    });

    const items = aiResponse.choices[0].message.content;

    await respond({
      text: items,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '🎯 Pending Action Items' }
        },
        { type: 'divider' },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: items }
        },
        { type: 'divider' },
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: `🔍 Searched ${formattedMessages.length} messages` }
          ]
        }
      ]
    });

  } catch (error) {
    console.error('Error:', error);
    await respond(`❌ Error: ${error.message}`);
  }
});

// ===== EVENT: @mention response =====
app.event('app_mention', async ({ event, say, client }) => {
  try {
    const userQuestion = event.text.replace(/<@[^>]+>/g, '').trim();

    const messages = await getChannelMessages(client, event.channel, 30);

    if (messages.length === 0) {
      await say(`Hey <@${event.user}>! 🤖 I'm the Meeting Insights Agent. Use /meeting-summary and /action-items commands to get started!`);
      return;
    }

    const formattedMessages = [];
    for (const msg of messages.slice(0, 15)) {
      if (msg.subtype) continue;
      const name = await getUserName(client, msg.user);
      formattedMessages.push(`[${name}]: ${msg.text}`);
    }

    const context = formattedMessages.join('\n');

    const aiResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a Meeting Insights Agent. Answer the user's question based on Slack channel message history. Be concise and helpful.`
        },
        {
          role: 'user',
          content: `Channel history:\n${context}\n\nQuestion: ${userQuestion}`
        }
      ],
      temperature: 0.3,
    });

    await say(aiResponse.choices[0].message.content);

  } catch (error) {
    console.error('Mention Error:', error);
    await say(`Sorry, an error occurred: ${error.message}`);
  }
});

// ===== EVENT: Auto detect action items =====
app.event('message', async ({ event, client, logger }) => {
  if (event.bot_id) return;
  if (event.subtype) return;

  const text = (event.text || '').toLowerCase();
  const actionKeywords = ['i will', "i'll", 'action item', 'todo', 'follow up', 'assign', 'deadline', 'by friday', 'by monday', 'by eod', 'will do', 'need to', 'let me'];
  const hasActionItem = actionKeywords.some(kw => text.includes(kw));

  if (hasActionItem) {
    try {
      const check = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `This is a Slack message. Check if it contains a genuine action item or commitment. Respond only in JSON format: {"is_action_item": true/false, "task": "description", "assignee": "who"}`
          },
          {
            role: 'user',
            content: event.text
          }
        ],
        temperature: 0.1,
      });

      const result = JSON.parse(check.choices[0].message.content);

      if (result.is_action_item) {
        await client.chat.postMessage({
          channel: event.channel,
          text: `📋 *Action Item Detected!*\n• ${result.task}\n• Assignee: ${result.assignee}\n\n_I'll track this for you!_`,
        });
      }
    } catch (e) {
      logger.error('Auto-detect error:', e);
    }
  }
});

// ===== START BOT =====
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡ Meeting Insights Agent is RUNNING!');
  console.log('📡 Listening for /meeting-summary, /action-items, and @mentions...');
})();
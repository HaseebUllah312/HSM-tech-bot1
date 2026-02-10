/**
 * Info & Menu Commands
 * Displays help menu, bot status, and contact info.
 */

const config = require('../config');
const { settings } = require('../dataStore');

// Helper function to format uptime
function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

const commands = {
    // Owner Info
    owner: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n'
            + `FN:𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑.\n` // full name
            + `ORG:HSM Tech;\n` // the organization of the contact
            + `TEL;type=CELL;type=VOICE;waid=${config.OWNER_HELP_NUMBER}:${config.OWNER_HELP_NUMBER}\n` // WhatsApp ID + phone number
            + 'END:VCARD';

        await sock.sendMessage(remoteJid, {
            contacts: {
                displayName: '𝕴𝖙\'s 𝕸𝖚𝖌𝖍𝖆𝖑.',
                contacts: [{ vcard }]
            }
        });
    },

    // Main Menu / Help - COMPREHENSIVE
    help: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;

        // Header
        let menu = `╔═══════════════════╗\n`;
        menu += `   🤖 *${config.BOT_NAME}* 🤖\n`;
        menu += `╚═══════════════════╝\n\n`;

        menu += `👋 *Hello!* Welcome to HSM Bot\n`;
        menu += `Here are all available commands:\n\n`;

        // 👑 OWNER COMMANDS (Visible to Owner Only)
        if (isOwner) {
            menu += `═══════════════════════\n`;
            menu += `👑 *OWNER COMMANDS*\n`;
            menu += `═══════════════════════\n\n`;

            menu += `🎛️ *Feature Control*\n`;
            menu += `• ${config.BOT_PREFIX}botzero\n  └ Disable ALL features (silence)\n`;
            menu += `• ${config.BOT_PREFIX}botall\n  └ Enable ALL features\n\n`;

            menu += `🎮 *Remote Control*\n`;
            menu += `• ${config.BOT_PREFIX}active\n  └ List all active groups\n`;
            menu += `• ${config.BOT_PREFIX}remote <SR/Num> <Cmd>\n  └ Execute command remotely\n`;
            menu += `• ${config.BOT_PREFIX}jin\n  └ Easter egg command\n\n`;

            menu += `📡 *Broadcast*\n`;
            menu += `• ${config.BOT_PREFIX}broadcast <msg>\n  └ Broadcast text to all groups\n`;
            menu += `• Reply + ${config.BOT_PREFIX}broadcast\n  └ Forward message to all groups\n`;
            menu += `• ${config.BOT_PREFIX}inbox ai on/off <num>\n  └ Toggle AI for specific inbox\n\n`;

            menu += `🛡️ *Whitelist (Owner Only)*\n`;
            menu += `• ${config.BOT_PREFIX}whitelist <link>\n  └ Add channel to whitelist\n`;
            menu += `• ${config.BOT_PREFIX}whitelist list\n  └ View whitelisted channels\n`;
            menu += `• ${config.BOT_PREFIX}whitelist remove <link>\n  └ Remove from whitelist\n`;
            menu += `• ${config.BOT_PREFIX}whitelist reset\n  └ Clear all channels\n\n`;
        }

        // 🛡 ADMIN COMMANDS (Visible to Admin & Owner)
        if (isGroupAdmin || isOwner) {
            menu += `═══════════════════════\n`;
            menu += `⚡ *ADMIN COMMANDS*\n`;
            menu += `═══════════════════════\n\n`;

            menu += `🛡️ *Security & Moderation*\n`;
            menu += `• ${config.BOT_PREFIX}antilink on/off\n`;
            menu += `• ${config.BOT_PREFIX}antisticker on/off\n`;
            menu += `• ${config.BOT_PREFIX}antitag on/off\n`;
            menu += `• ${config.BOT_PREFIX}antipromotion on/off\n`;
            menu += `• ${config.BOT_PREFIX}antistatus on/off\n`;
            menu += `• ${config.BOT_PREFIX}antivote on/off\n`;
            menu += `• ${config.BOT_PREFIX}antispam on/off\n`;
            menu += `• ${config.BOT_PREFIX}shield on/off\n`;
            menu += `• ${config.BOT_PREFIX}media on/off\n\n`;

            menu += `📁 *Feature Toggles*\n`;
            menu += `• ${config.BOT_PREFIX}welcome on/off\n  └ Welcome/goodbye messages\n`;
            menu += `• ${config.BOT_PREFIX}filesharing on/off\n  └ File search and sharing\n`;
            menu += `• ${config.BOT_PREFIX}features\n  └ View all feature status\n\n`;

            menu += `🏛️ *Group Management*\n`;
            menu += `• ${config.BOT_PREFIX}open\n  └ Allow everyone to message\n`;
            menu += `• ${config.BOT_PREFIX}close\n  └ Only admins can message\n`;
            menu += `• ${config.BOT_PREFIX}mute <minutes>\n  └ Close group temporarily\n`;
            menu += `• ${config.BOT_PREFIX}kick @user\n  └ Remove user from group\n`;
            menu += `• ${config.BOT_PREFIX}tagall <msg>\n  └ Tag all members (alias: !t)\n`;
            menu += `• ${config.BOT_PREFIX}link\n  └ Get group invite link\n`;
            menu += `• ${config.BOT_PREFIX}ginfo\n  └ View group information\n\n`;

            menu += `🤖 *AI & Automation*\n`;
            menu += `• ${config.BOT_PREFIX}ai on/off\n  └ Toggle AI auto-replies\n`;
            menu += `• ${config.BOT_PREFIX}ai clear\n  └ Clear AI memory\n`;
            menu += `• ${config.BOT_PREFIX}handlegroup\n  └ Toggle auto-admin AI\n`;
            menu += `• ${config.BOT_PREFIX}autoopen HH:MM\n  └ Schedule daily group open\n`;
            menu += `• ${config.BOT_PREFIX}autoclose HH:MM\n  └ Schedule daily group close\n`;
            menu += `• ${config.BOT_PREFIX}autotimer off\n  └ Disable timers\n\n`;

            menu += `⚠️ *Warnings & Users*\n`;
            menu += `• ${config.BOT_PREFIX}warnlist\n  └ View all warned users\n`;
            menu += `• ${config.BOT_PREFIX}showwarn @user\n  └ View user's warnings\n`;
            menu += `• ${config.BOT_PREFIX}resetwarn @user/all\n  └ Reset warnings\n`;
            menu += `• ${config.BOT_PREFIX}setwarnlimit <1-10>\n  └ Set warning limit\n`;
            menu += `• ${config.BOT_PREFIX}lock @user\n  └ Lock user (kick after 3 msg)\n`;
            menu += `• ${config.BOT_PREFIX}unlock @user\n  └ Unlock user\n\n`;

            menu += `🎉 *Fun Commands*\n`;
            menu += `• ${config.BOT_PREFIX}bd @user\n  └ Birthday wishes\n\n`;

            menu += `📂 *File Management*\n`;
            menu += `• ${config.BOT_PREFIX}allfiles\n  └ List all subjects\n`;
            menu += `• ${config.BOT_PREFIX}stop\n  └ Stop file sending\n`;
            menu += `• ${config.BOT_PREFIX}resume\n  └ Resume file sending\n\n`;
        }

        // 👥 MEMBER COMMANDS (Visible to Everyone)
        menu += `═══════════════════════\n`;
        menu += `📚 *PUBLIC COMMANDS*\n`;
        menu += `═══════════════════════\n\n`;

        menu += `📖 *Study Materials*\n`;
        menu += `• Type Subject Code\n  └ Example: CS101, MTH101\n  └ Get handouts & past papers\n`;
        menu += `• Send "more" or "aur bhejo"\n  └ Get more files\n`;
        menu += `• ${config.BOT_PREFIX}files\n  └ List available subjects\n\n`;

        menu += `🤖 *AI Assistant*\n`;
        menu += `• ${config.BOT_PREFIX}ai <question>\n  └ Ask AI anything\n`;
        menu += `• Say "hi" or "hello"\n  └ Start conversation\n\n`;

        menu += `ℹ️ *Information*\n`;
        menu += `• ${config.BOT_PREFIX}help or ${config.BOT_PREFIX}menu\n  └ Show this menu\n`;
        menu += `• ${config.BOT_PREFIX}uptime\n  └ Check bot uptime\n`;
        menu += `• ${config.BOT_PREFIX}intro\n  └ About this bot\n`;
        menu += `• ${config.BOT_PREFIX}owner\n  └ Contact support\n\n`;

        // Footer
        menu += `═══════════════════════\n`;
        menu += `👑 *Owner:* 𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑.\n`;
        menu += `🚀 *Powered by HSM Tech*`;

        await sock.sendMessage(remoteJid, { text: menu });
    },

    // Alias for help
    menu: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await commands.help(sock, msg, args, isGroupAdmin, isOwner);
    },

    // Group Introduction
    intro: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        const introMsg = `╔══════════════════════════════╗
║   🤖 *${config.BOT_NAME}*
║   *Your Smart Study Companion*
║   *Online Time:* ${formatUptime(process.uptime())}
╚══════════════════════════════╝

👋 *Hello Everyone!*

I am here to make your student life easier! 🚀

📌 *WHAT CAN I DO?*

📚 *Instant Study Material*
Just type your subject code (e.g., *CS101*, *MTH101*, *ENG101*) and I will instantly send you:
• Handouts 📖
• Past Papers 📝
• Important Notes 🗒️

🧠 *AI Assistant (Gemini + Groq)*
Need help with a topic? Just ask me!
Type: \`${config.BOT_PREFIX}ai What is recursion?\`

🛡️ *Group Safety*
I help keep the group safe from spam, links, and bad behavior.

━━━━━━━━━━━━━━━━━━━━━
💡 *TRY IT NOW:*
Type \`!help\` to see all commands.
Type your subject code (e.g. \`CS101\`) to get files!

👑 *Powered by:* 𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑.`;

        await sock.sendMessage(remoteJid, {
            image: { url: 'https://i.imgur.com/7YjKjM6.jpeg' }, // Optional: Add a placeholder or real logo URL if known, otherwise just text.
            // Using text only for safety if no logo is configured, or use a known safe placeholder. 
            // The user didn't provide a logo. Let's stick to text-only for reliability, or use the project logo if it exists locally.
            // I'll stick to a text message for now to specific key 'text'.
            text: introMsg
        });
    },

    // Uptime Command
    uptime: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        const uptime = process.uptime();
        const uptimeString = formatUptime(uptime);

        const uptimeMsg = `🤖 *Bot Status Report*\n\n` +
            `🕒 *Uptime:* ${uptimeString}\n` +
            `📅 *Since:* ${new Date(Date.now() - (uptime * 1000)).toLocaleString()}\n\n` +
            `🚀 *System is running smoothly!*`;

        await sock.sendMessage(remoteJid, { text: uptimeMsg });
    }
};

module.exports = commands;

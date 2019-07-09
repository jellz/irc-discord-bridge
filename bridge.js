require('dotenv').config();
const Discord = require('discord.js');
const irc = require('irc');

const ircClient = new irc.Client('chat.freenode.net', process.env.IRC_BOT_NAME, {
	channels: [process.env.IRC_CHANNEL]
});

const discordClient = new Discord.Client({ disableEveryone: true });
discordClient.login(process.env.DISCORD_TOKEN);

// IRC EVENTS
ircClient.on('error', (message) => {
	console.error('irc error ', message);
});

ircClient.on(`message${process.env.IRC_CHANNEL}`, async (from, message) => {
	console.log(from, message);
	const channel = discordClient.bridgeChannel;
	await channel.send(`<${from}> ${message}`);
});

ircClient.on('registered', () => {
	console.log('[irc] ready');
});

// DISCORD EVENTS
discordClient.on('ready', async () => {
	console.log(`[discord] ${discordClient.user.tag} ready`);
	discordClient.bridgeChannel = await discordClient.channels.get(process.env.DISCORD_CHANNEL);
});

discordClient.on('message', (message) => {
	if (message.author.id == discordClient.user.id) return;
	if (message.channel.id !== process.env.DISCORD_CHANNEL) return;
	const tagWithZeroWidthChar = message.author.tag.slice(0, 2) + '​' + message.author.tag.slice(2);
	ircClient.say(process.env.IRC_CHANNEL, `<@${tagWithZeroWidthChar}> ${message.content}`);
});
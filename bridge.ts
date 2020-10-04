require('dotenv').config();
import { Client, TextChannel } from 'discord.js';
import irc from 'irc';

if (!process.env.IRC_BOT_NAME)
	throw Error('Missing environment variable: IRC_BOT_NAME');
if (!process.env.IRC_CHANNEL)
	throw Error('Missing environment variable: IRC_CHANNEL');
if (!process.env.DISCORD_TOKEN)
	throw Error('Missing environment variable: DISCORD_TOKEN');
if (!process.env.DISCORD_CHANNEL)
	throw Error('Missing environment variable: DISCORD_CHANNEL');

const ircClient = new irc.Client(
	process.env.IRC_NETWORK || 'chat.freenode.net',
	process.env.IRC_BOT_NAME,
	{
		channels: [process.env.IRC_CHANNEL],
	}
);

const discordClient = new Client({ disableEveryone: true });
discordClient.login(process.env.DISCORD_TOKEN);

let bridgeChannel: TextChannel | undefined;

// IRC EVENTS
ircClient.on('error', message => {
	console.error('irc error ', message);
});

ircClient.on(`message${process.env.IRC_CHANNEL}`, async (from, message) => {
	console.log(from, message);
	if (message.trim().length < 1) return;
	if (bridgeChannel) await bridgeChannel.send(`<${from}> ${message.trim()}`);
});

ircClient.on('registered', () => {
	console.log('[irc] ready');
});

// DISCORD EVENTS
discordClient.on('ready', async () => {
	console.log(`[discord] ${discordClient.user?.tag} ready`);
	bridgeChannel = <TextChannel>(
		discordClient.channels.get(process.env.DISCORD_CHANNEL!)
	);
});

discordClient.on('message', message => {
	if (message.author?.id == discordClient.user?.id) return;
	if (message.channel.id !== process.env.DISCORD_CHANNEL) return;
	const tagWithZeroWidthChar =
		message.author?.tag.slice(0, 2) + '​' + message.author?.tag.slice(2);
	ircClient.say(
		process.env.IRC_CHANNEL!,
		`<@${tagWithZeroWidthChar}> ${message.content}`
	);
});

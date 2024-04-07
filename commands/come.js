// play.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

module.exports = async (message, client) => {
    // Check if the message author is in a voice channel
    const memberVoiceChannel = message.member.voice.channel;
    if (!memberVoiceChannel) {
        return message.reply('Debes estar en un canal de voz para que el bot pueda reproducir música.');
    }

    // Extract the YouTube URL from the message
    const args = message.content.split(' ');
    const url = args[1];
    if (!url) {
        return message.reply('Por favor, proporciona un enlace de YouTube para reproducir.');
    }

    // Join the voice channel
    const connection = joinVoiceChannel({
        channelId: memberVoiceChannel.id,
        guildId: memberVoiceChannel.guild.id,
        adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator,
    });

    // Create an audio player
    const player = createAudioPlayer();
    connection.subscribe(player);

    // Play the YouTube video
    const stream = ytdl(url, { filter: 'audioonly' });
    const resource = createAudioResource(stream);
    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
    });

    message.reply('Reproduciendo música...');
};

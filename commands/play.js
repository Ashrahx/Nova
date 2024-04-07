// play.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const YouTube = require('youtube-sr').default;

module.exports = async (message, client) => {
    // Check if the message author is in a voice channel
    const memberVoiceChannel = message.member.voice.channel;
    if (!memberVoiceChannel) {
        return message.reply('Debes estar en un canal de voz para que el bot pueda reproducir música.');
    }

    // Extract the input from the message
    const args = message.content.split(' ');
    const input = args[1];
    const artist = args[2]; // Assuming the artist's name is the second argument
    if (!input || !artist) {
        return message.reply('Por favor, proporciona el nombre de una canción y el nombre del artista para reproducir.');
    }

    let searchResults;
    try {
        // Search for the song by the artist and song title
        searchResults = await YouTube.search(`${artist} ${input}`, { limit: 5 });
        if (searchResults.length === 0) {
            return message.reply('No se encontró ninguna canción con ese nombre y artista.');
        }
    } catch (error) {
        console.error('Error al buscar en YouTube:', error);
        return message.reply('Ocurrió un error al buscar la canción en YouTube.');
    }

    // Send a message with the search results
    const embed = {
        title: 'Resultados de búsqueda',
        description: searchResults.map((result, index) => `${index + 1}. ${result.title}`).join('\n'),
        color: 0x8a5bff,
    };
    message.channel.send({ embeds: [embed] });

    // Wait for the user's response to select a song
    const filter = m => m.author.id === message.author.id;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 }); // Wait for 30 seconds

    if (collected.size === 0) {
        return message.reply('No seleccionaste ninguna canción.');
    }

    const selection = collected.first().content;
    const selectedIndex = parseInt(selection, 10) - 1; // Adjust for 0-based index
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= searchResults.length) {
        return message.reply('Selección inválida.');
    }

    const url = searchResults[selectedIndex].url;

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

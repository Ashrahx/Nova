// play.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const YouTube = require('youtube-sr').default;

module.exports = async (message, client) => {
    // Verifica si el autor se ecnuentra en un canal de voz
    const memberVoiceChannel = message.member.voice.channel;
    if (!memberVoiceChannel) {
        return message.reply('Debes estar en un canal de voz para que el bot pueda reproducir música.');
    }

    // Revisa el input
    const args = message.content.split(' ');
    const input = args[1];
    const artist = args[2];
    if (!input || !artist) {
        return message.reply('Por favor, proporciona el nombre de una canción y el nombre del artista para reproducir.');
    }

    let searchResults;
    try {
        // Busca la canción por artista y nombre de la canción
        searchResults = await YouTube.search(`${artist} ${input}`, { limit: 5 });
        if (searchResults.length === 0) {
            return message.reply('No se encontró ninguna canción con ese nombre y artista.');
        }
    } catch (error) {
        console.error('Error al buscar en YouTube:', error);
        return message.reply('Ocurrió un error al buscar la canción en YouTube.');
    }

    // Envía el mensaje con los reusultados de la busqueda
    const embed = {
        title: 'Resultados de búsqueda',
        description: searchResults.map((result, index) => `${index + 1}. ${result.title}`).join('\n'),
        color: 0x8a5bff,
    };
    message.channel.send({ embeds: [embed] });

    // Espera la respuesta del ususario
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

    // Ingresa al canal de voz
    const connection = joinVoiceChannel({
        channelId: memberVoiceChannel.id,
        guildId: memberVoiceChannel.guild.id,
        adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator,
    });

    // Crea un audio player
    const player = createAudioPlayer();
    connection.subscribe(player);

    // Reproduce la petición
    const stream = ytdl(url, { filter: 'audioonly' });
    const resource = createAudioResource(stream);
    player.play(resource);

    player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
    });

    message.reply('Reproduciendo música...');
};

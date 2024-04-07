const Discord = require('discord.js');
require('dotenv').config();

const Client = new Discord.Client({
    intents: [
        3276799,
        Discord.Intents.FLAGS.GUILDS_VOICE_STATES
    ]
});

Client.on('ready', async (client) => {
    console.log(`Logged in as ${Client.user.tag}!`);
});

Client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('/')) return;

    try {
        const command = message.content.toLocaleLowerCase().slice(1).split(' ')[0];
        console.log(command);
        const executeCommand = require(`./commands/${command}.js`);
        executeCommand(message, Client);
    } catch (error) {
        console.error(`${message.content} no es un comando válido`);
    }
});

Client.on('guildMemberAdd', async (member) => {
    const {user} = member;
    const embed = {
        title : `${user.username} se ha unido al servidor!`,
        description: 'Bienvenido al servidor',
        color: 0x8a5bff,
        thumbnail: {url: user.avatarURL()}
    };

    const button = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder({
            style: 3,
            label: 'Saludar',
            emoji: '👋',
            custom_id: 'saludo'
        })
    )

    const channelId = '1107918331278807101';
    Client.channels.fetch(channelId)
     .then(channel => channel.send({embeds: [embed], components: [button]}));

});


Client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId == 'saludo') return interaction.reply({content: `${interaction.user} te da la bienvenida al servidor!`})
});

Client.login(process.env.DISCORD_TOKEN);

module.exports = async (message, client) => {
    const ping = client.ws.ping;
    const embed = {
        description: `**Pong!** Latency : \`${ping}ms\``,
        color: 0x8a5bff,
    };
    message.reply({embeds: [embed]});
}

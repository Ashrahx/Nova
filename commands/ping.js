module.exports = async (message, client) => {
    const ping = client.ws.ping;
    const embed = {
        description: `**Pong!** Latency : \`${ping}ms\``
    };
    message.reply({embeds: [embed]});
}

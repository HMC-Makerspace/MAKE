import discord
import config

intents = discord.Intents.default()
intents.members = True

class MakeBot(discord.Client):
    async def on_ready(self):
        print('Logged on as {0}!'.format(self.user))
        print('------')


client = MyClient(intents=intents)
client.run(config.DISCORD_BOT_TOKEN)
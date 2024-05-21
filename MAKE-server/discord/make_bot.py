import asyncio
import datetime
import logging
import discord
from discord.ext import tasks, commands

from db_schema import MongoDB

intents = discord.Intents.default()
intents.members = True

class MakeBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True

        super().__init__(command_prefix=commands.when_mentioned_or('$'), intents=intents)

    async def setup_hook(self) -> None:
        # Register the persistent view for listening here.
        # Note that this does not send the view to any message.
        # In order to do this you need to first send a message with the View, which is shown below.
        # If you have the message_id you can also pass it as a keyword argument, but for this example
        # we don't have one.
        self.add_view(CollegeView())
        self.add_view(PronounView())
        self.add_view(YearView())

        self.no_steward_message_sent = False
        #self.announcement_channel_id = 857333481474097203
        self.announcement_channel_id = 526941847831183363
        self.roles_channel_id = 857325041003790346

    async def on_ready(self):
        logging.getLogger().info(f"Logged in as {self.user.name} ({self.user.id})")


    async def on_member_join(self, member):
        channel = self.get_channel(self.roles_channel_id)

        if channel:
            message = (f"Welcome to the HMC Makerspace Discord, {member.mention}!\n\n"
                       f"Head over to {channel.mention} to select your roles.")
            
            await member.send(message)

    async def check_shifts(self):
        await asyncio.sleep(1)
        hour = datetime.datetime.now().hour
        # Get yyyy-mm-dd
        day_timestamp = datetime.datetime.now().strftime("%Y-%m-%d")

        if hour == 0:
            hour = "12:00 AM"
        elif hour == 12:
            hour = "12:00 PM"
        elif hour > 12:
            hour = str(hour - 12) + ":00 PM"
        else:
            hour = str(hour) + ":00 AM"

        if self.no_steward_message_sent == hour:
            return
        else:
            self.no_steward_message_sent = False

        db = MongoDB()

        shifts = await db.get_collection("shifts")
        
        shift = await shifts.find_one({"timestamp_start": hour})
        if shift is not None:
            # If there's a shift scheduled for this hour, check if theres dropped shifts
            shift_changes = await db.get_collection("shift_changes")

            # Find all dropped shifts for this hour
            changes = await shift_changes.find({"day_timestamp": day_timestamp, "timestamp_start": hour}).to_list(None)

            if changes is not None:
                dropped = 0
                pickup = 0

                for change in changes:
                    if change["is_drop"]:
                        dropped += 1
                    else:
                        pickup += 1

                # All stewards have dropped their shifts and no one has picked up
                if dropped == len(shift["stewards"]) and pickup == 0:
                    # Send message to announcement channel
                    channel = self.get_channel(self.announcement_channel_id)
                    await channel.send(f"**Schedule change:** there will be no stewards for the {hour} shift today. We apologize for the inconvenience.")

                    self.no_steward_message_sent = hour

bot = MakeBot()

class CollegeView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label='Harvey Mudd', style=discord.ButtonStyle.blurple, custom_id='persistent_view:college:hmc')
    async def hmc(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Harvey Mudd!', ephemeral=True)
        await grant_create_role(interaction.user, "Harvey Mudd", to_remove=["Pomona", "Pitzer", "Scripps", "Claremont McKenna", "Claremont Graduate University", "Keck Graduate Institute"])
    
    @discord.ui.button(label='Pitzer', style=discord.ButtonStyle.blurple, custom_id='persistent_view:college:pitzer')
    async def pitzer(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Pitzer!', ephemeral=True)
        await grant_create_role(interaction.user, "Pitzer", to_remove=["Harvey Mudd", "Pomona", "Scripps", "Claremont McKenna", "Claremont Graduate University", "Keck Graduate Institute"])

    @discord.ui.button(label='Pomona', style=discord.ButtonStyle.blurple, custom_id='persistent_view:college:pomona')
    async def pomona(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Pomona!', ephemeral=True)
        await grant_create_role(interaction.user, "Pomona", to_remove=["Harvey Mudd", "Pitzer", "Scripps", "Claremont McKenna", "Claremont Graduate University", "Keck Graduate Institute"])
    
    @discord.ui.button(label='Scripps', style=discord.ButtonStyle.blurple, custom_id='persistent_view:college:scripps')
    async def scripps(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Scripps!', ephemeral=True)
        await grant_create_role(interaction.user, "Scripps", to_remove=["Harvey Mudd", "Pitzer", "Pomona", "Claremont McKenna", "Claremont Graduate University", "Keck Graduate Institute"])

    @discord.ui.button(label='Claremont McKenna', style=discord.ButtonStyle.blurple, custom_id='persistent_view:college:cmc')
    async def cmc(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Claremont McKenna!', ephemeral=True)
        await grant_create_role(interaction.user, "Claremont McKenna", to_remove=["Harvey Mudd", "Pitzer", "Pomona", "Scripps", "Claremont Graduate University", "Keck Graduate Institute"])

    @discord.ui.button(label='Claremont Graduate University', style=discord.ButtonStyle.blurple, custom_id='persistent_view:college:cgu')
    async def cgu(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Claremont Graduate University!', ephemeral=True)
        await grant_create_role(interaction.user, "Claremont Graduate University", to_remove=["Harvey Mudd", "Pitzer", "Pomona", "Scripps", "Claremont McKenna", "Keck Graduate Institute"])
    
    @discord.ui.button(label='Keck Graduate Institute', style=discord.ButtonStyle.blurple, custom_id='persistent_view:college:kgi')
    async def kgi(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Keck Graduate Institute!', ephemeral=True)
        await grant_create_role(interaction.user, "Keck Graduate Institute", to_remove=["Harvey Mudd", "Pitzer", "Pomona", "Scripps", "Claremont McKenna", "Claremont Graduate University"])


class PronounView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label='He/Him', style=discord.ButtonStyle.blurple, custom_id='persistent_view:pronoun:he/him')
    async def he_him(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role He/Him!', ephemeral=True)
        await grant_create_role(interaction.user, "He/Him", to_remove=["She/Her", "They/Them", "He/They", "She/They", "Any Pronouns"])

    @discord.ui.button(label='She/Her', style=discord.ButtonStyle.blurple, custom_id='persistent_view:pronoun:she/her')
    async def she_her(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role She/Her!', ephemeral=True)
        await grant_create_role(interaction.user, "She/Her", to_remove=["He/Him", "They/Them", "He/They", "She/They", "Any Pronouns"])
        
    @discord.ui.button(label='They/Them', style=discord.ButtonStyle.blurple, custom_id='persistent_view:pronoun:they/them')
    async def they_them(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role They/Them!', ephemeral=True)
        await grant_create_role(interaction.user, "They/Them", to_remove=["He/Him", "She/Her", "He/They", "She/They", "Any Pronouns"])

    @discord.ui.button(label='He/They', style=discord.ButtonStyle.blurple, custom_id='persistent_view:pronoun:he/they')
    async def he_they(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role He/They!', ephemeral=True)
        await grant_create_role(interaction.user, "He/They", to_remove=["He/Him", "She/Her", "They/Them", "She/They", "Any Pronouns"])

    @discord.ui.button(label='She/They', style=discord.ButtonStyle.blurple, custom_id='persistent_view:pronoun:she/they')
    async def she_they(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role She/They!', ephemeral=True)
        await grant_create_role(interaction.user, "She/They", to_remove=["He/Him", "She/Her", "They/Them", "He/They", "Any Pronouns"])

    @discord.ui.button(label='Any Pronouns', style=discord.ButtonStyle.blurple, custom_id='persistent_view:pronoun:any pronouns')
    async def any_pronouns(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Any Pronouns!', ephemeral=True)
        await grant_create_role(interaction.user, "Any Pronouns", to_remove=["He/Him", "She/Her", "They/Them", "He/They", "She/They"])
        
    @discord.ui.button(label='Other', style=discord.ButtonStyle.blurple, custom_id='persistent_view:pronoun:other')
    async def other(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Other!', ephemeral=True)
        await grant_create_role(interaction.user, "Other", to_remove=["He/Him", "She/Her", "They/Them", "He/They", "She/They", "Any Pronouns"])
    
class YearView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label='Staff/Faculty', style=discord.ButtonStyle.blurple, custom_id='persistent_view:year:staff/faculty')
    async def staff_faculty(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role Staff/Faculty!', ephemeral=True)
        await grant_create_role(interaction.user, "Staff/Faculty", to_remove=["2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035", "2036", "2037", "2038", "2039", "2040"])

    @discord.ui.button(label='2025', style=discord.ButtonStyle.blurple, custom_id='persistent_view:year:2025')
    async def year_2025(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role 2025!', ephemeral=True)
        await grant_create_role(interaction.user, "2025", to_remove=["Staff/Faculty", "2024", "2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035", "2036", "2037", "2038", "2039", "2040"])

    @discord.ui.button(label='2026', style=discord.ButtonStyle.blurple, custom_id='persistent_view:year:2026')
    async def year_2026(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role 2026!', ephemeral=True)
        await grant_create_role(interaction.user, "2026", to_remove=["Staff/Faculty", "2024", "2025", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035", "2036", "2037", "2038", "2039", "2040"])

    @discord.ui.button(label='2027', style=discord.ButtonStyle.blurple, custom_id='persistent_view:year:2027')
    async def year_2027(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role 2027!', ephemeral=True)
        await grant_create_role(interaction.user, "2027", to_remove=["Staff/Faculty", "2024", "2025", "2026", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035", "2036", "2037", "2038", "2039", "2040"])

    @discord.ui.button(label='2028', style=discord.ButtonStyle.blurple, custom_id='persistent_view:year:2028')
    async def year_2028(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role 2028!', ephemeral=True)
        await grant_create_role(interaction.user, "2028", to_remove=["Staff/Faculty", "2024", "2025", "2026", "2027", "2029", "2030", "2031", "2032", "2033", "2034", "2035", "2036", "2037", "2038", "2039", "2040"])

    @discord.ui.button(label='2029', style=discord.ButtonStyle.blurple, custom_id='persistent_view:year:2029')
    async def year_2029(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message('Gained role 2029!', ephemeral=True)
        await grant_create_role(interaction.user, "2029", to_remove=["Staff/Faculty", "2024", "2025", "2026", "2027", "2028", "2030", "2031", "2032", "2033", "2034", "2035", "2036", "2037", "2038", "2039", "2040"])



@bot.command()
@commands.has_permissions(administrator=True)
async def send_reaction_message(ctx):
    await ctx.send('''**Select your college**''', view=CollegeView())

    await ctx.send('''**Select your pronouns**''', view=PronounView())

    await ctx.send('''**Select your class year**''', view=YearView())

        

async def grant_create_role(user, role_name, to_remove=[]):
    guild = user.guild
    role = discord.utils.get(guild.roles, name=role_name)

    if role is None:
        role = await guild.create_role(name=role_name)

    await user.add_roles(role)

    if len(to_remove) > 0:
        for r in to_remove: 
            role = discord.utils.get(guild.roles, name=r)

            if role is not None:
                await user.remove_roles(role)

async def run_discord_bot(TOKEN):
    if TOKEN == "":
        print("DISCORD_TOKEN is not set")
        return
    
    await bot.start(TOKEN)
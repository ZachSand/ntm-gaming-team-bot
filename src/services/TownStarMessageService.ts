import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { TownStarLeaderboardUser } from '../types/tsLeaderboardUser.js';

export const buildTownStarWeeklyLeaderboardEmbed = (
  name: string,
  townStarLeaderboardUsers: TownStarLeaderboardUser[],
): MessageEmbed =>
  new MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Town Star Weekly Competition')
    .setDescription(`Listing of players for the Town Star Weekly Competition with ${name} in their town name`)
    .addFields(
      townStarLeaderboardUsers
        .filter((user) => user.name.toUpperCase().trim().includes(name.toUpperCase().trim()))
        .map(
          (user) =>
            <EmbedFieldData>{
              name: user.name,
              value: `Rank: ${user.rank} Score: ${user.score}`,
            },
        ),
    )
    .setTimestamp()
    .setFooter('NTM Discord Bot');

export const buildTownStarCraftMetricsMessage = (craftData: Map<string, number>): string =>
  `\`\`\`\n${JSON.stringify(Array.from(craftData.entries()))}\`\`\``;

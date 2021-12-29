import { EmbedFieldData, MessageEmbed } from 'discord.js';
import { TownStarLeaderboardUser } from '../types/tsLeaderboardUser.js';

export const buildTownStarWeeklyLeaderboardEmbed = (
  searchTerm: string,
  townStarLeaderboardUsers: TownStarLeaderboardUser[],
  currentPage: number,
  totalPages: number,
): MessageEmbed =>
  new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`Town Star Weekly Competition (Page ${currentPage}/${totalPages})`)
    .setDescription(`Listing of players for the Town Star Weekly Competition with ${searchTerm} in their town name`)
    .addFields(
      townStarLeaderboardUsers.map(
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

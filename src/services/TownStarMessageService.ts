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

export const buildTownStarCraftMetricsMessage = (
  craft: string,
  craftData: Map<string, number>,
  craftAmount: number,
): MessageEmbed => {
  const embedFieldData: EmbedFieldData[] = [];
  craftData.forEach((materialCount: number, materialName: string) =>
    embedFieldData.push({
      name: materialName,
      value: String(materialCount * craftAmount),
      inline: true,
    }),
  );
  return new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`Town Star craft materials for ${craftAmount} **${craft}**`)
    .setDescription(
      `Materials pulled from live game data. Common passive materials such as Water, Water Drum, Energy and Crude Oil are not included`,
    )
    .addFields(embedFieldData)
    .setTimestamp()
    .setFooter('NTM Discord Bot');
};

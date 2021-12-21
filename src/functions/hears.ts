import { bot } from "./discord.js";
import axios from "axios";
import { OpenSeaAsset } from "../types/osAsset.js";
import { getOpenSeaAssetByNameAndCollection, writeOpenSeaAsset } from "./databases.js";
import { EmbedFieldData, Message, MessageEmbed } from "discord.js";
import { TownStarLeaderboardUser } from "../types/tsLeaderboardUser.js";

const headers = {
	"Content-Type": "application/json",
	"x-sessionid": "697a0b322f6d265ea44b18fd43211794cb86e70302b81f43",
};

const galaContractAddress = "0xc36cf0cfcb5d905b8b513860db0cfe63f6cf9f5c";
const osAssetPageLimit = 50;
const totalAssetLimit = 1000;

function handleBotHelp(ctx: Message<boolean>) {
	ctx.channel.send(
		"Supported Bot Commnds:\n\n" +
			"`!tsweekly` - Displays the weekly leaderboard for users with NTM in their name\n\n" +
			"`!tsweekly name` - Displays the weekly leaderboard position for all towns with name in it. Example `!tsweekly ThirstyGoat`\n\n" +
			"`!tssweekly` - Displays the weekly scholar leaderboard for users with NTM-S in their name\n\n" +
			"`!os-town-star NFT Name` - Displays the OpenSea information for an item in the Town Star collection on OpenSea. " +
			"Name must match the exact name in OpenSea. Example, `!os-town-star Wheat Stand`\n\n" +
			"`!os-mirandus NFT Name` - Displays the OpenSea information for an item in the Mirandus collection on OpenSea. " +
			"Name must match the exact name in OpenSea. Example, `!os-mirandus Wharf`\n\n",
	);
}

export const text = async (): Promise<void> => {
	bot.on("messageCreate", async (ctx) => {
		if (!ctx.author.bot) {
			if (ctx.content.toUpperCase().trim().includes("!tsweekly".toUpperCase().trim())) {
				await replyTownStartWeekly(ctx);
			}
			if (ctx.content === "!tssweekly") {
				await replyTownStarWeeklyScholar(ctx);
			}
			if (ctx.content.includes("!os-")) {
				await handleOpenSeaMessage(ctx);
			}
			if (ctx.content.includes("!bot-commands")) {
				handleBotHelp(ctx);
			}
		}
	});
};

async function handleOpenSeaMessage(ctx: Message<boolean>) {
	let collectionSlug = undefined;
	if (ctx.content.includes("!os-town-star")) {
		collectionSlug = "town-star";
	} else if (ctx.content.includes("!os-mirandus")) {
		collectionSlug = "mirandus";
	} else {
		ctx.channel.send(`${ctx.content} is not supported`);
		return;
	}

	const osMessage = ctx.content.split(`!os-${collectionSlug}`);
	if (osMessage.length == 2) {
		const assetName = osMessage[1].trim();
		let asset: OpenSeaAsset = await getOpenSeaAssetByNameAndCollection(assetName, collectionSlug);
		if (!asset) {
			for (let i = 0; i < totalAssetLimit / osAssetPageLimit; i++) {
				const osAssetPage = await getOpenSeaAssetPage(collectionSlug, assetName, i * osAssetPageLimit);
				if (osAssetPage) {
					for (const osAsset of osAssetPage) {
						await writeOpenSeaAsset(osAsset);
						if (osAsset.name.toUpperCase() === assetName.toUpperCase()) {
							asset = osAsset;
							break;
						}
					}
				}
			}
		}
		if (asset) {
			try {
				const { data } = await axios.get(`https://api.opensea.io/api/v1/asset/${asset.contractAddress}/${asset.tokenId}`);
				const currentListings = data.orders.filter((order) => order.side == "1");
				if (!currentListings || currentListings.length < 1) {
					ctx.channel.send(`Unable to find ${asset.name} in OpenSea`);
					return;
				}
				const currentListing = currentListings.reduce((prev, current) =>
					(prev.current_price / Math.pow(10, prev.payment_token_contract.decimals)) * prev.payment_token_contract.eth_price <
					(current.current_price / Math.pow(10, current.payment_token_contract.decimals)) * current.payment_token_contract.eth_price
						? prev
						: current,
				);
				const openSeaAssetEmbed = new MessageEmbed()
					.setColor("#0099ff")
					.setTitle(`OpenSea ${collectionSlug} Asset: ${assetName}`)
					.setDescription(`Information from OpenSea for ${assetName}`)
					.setImage(data.image_url)
					.setURL(data.permalink)
					.addFields(
						{
							name: "Name",
							value: data.name,
						},
						{
							name: "Description",
							value: data.description,
						},
						{
							name: "Listing Price: ",
							value: `${currentListing.current_price / Math.pow(10, currentListing.payment_token_contract.decimals)} ${
								currentListing.payment_token_contract.symbol
							}`,
						},
						{
							name: "Last sale price",
							value: `${data.last_sale.total_price / Math.pow(10, data.last_sale.payment_token.decimals)} ${data.last_sale.payment_token.symbol}`,
						},
					)
					.setTimestamp()
					.setFooter("NTM Discord Bot");
				ctx.channel.send({ embeds: [openSeaAssetEmbed] });
			} catch (error) {
				if (axios.isAxiosError(error)) {
					console.error(error);
				} else {
					console.error(error);
				}
			}
		} else {
			ctx.channel.send(`Unable to find ${asset.name} in OpenSea`);
		}
	}
}

async function getOpenSeaAssetPage(collectionSlug: string, assetName: string, offset: number): Promise<[OpenSeaAsset]> {
	try {
		const { data } = await axios.get("https://api.opensea.io/api/v1/assets", {
			params: {
				asset_contract_address: galaContractAddress,
				offset: offset,
				limit: osAssetPageLimit,
				collection: collectionSlug,
			},
		});

		return data.assets.map(
			(asset) =>
				<OpenSeaAsset>{
					tokenId: asset.token_id,
					name: asset.name,
					contractAddress: galaContractAddress,
					collection: collectionSlug,
				},
		);
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error(error);
		} else {
			console.error(error);
		}
	}
}

async function getTsWeeklyLeaderboard() {
	let tsLeaderboardUsers: TownStarLeaderboardUser[];
	try {
		const { data } = await axios.get("https://townstar.sandbox-games.com/api/game/weekly/leader/score?start=1&stop=10000", {
			headers: headers,
		});
		tsLeaderboardUsers = data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error(error);
		} else {
			console.error(error);
		}
	}
	return tsLeaderboardUsers;
}

async function replyTownStartWeekly(ctx: Message<boolean>): Promise<void> {
	const tsLeaderboardUsers = await getTsWeeklyLeaderboard();
	if (!tsLeaderboardUsers) {
		ctx.channel.send("Unable to retrieve weekly leaderboard.");
		return;
	}
	const weeklyMessage = ctx.content.trim().split("!tsweekly");
	if (weeklyMessage.length > 1) {
		const userName = weeklyMessage[1];
		const tsLeaderboardEmbed = new MessageEmbed()
			.setColor("#0099ff")
			.setTitle("Town Star Weekly Competition")
			.setDescription(`Listing of players for the Town Star Weekly Competition with ${userName} in their name`)
			.addFields(
				tsLeaderboardUsers
					.filter((user) => user.name.toUpperCase().trim().includes(userName.toUpperCase().trim()))
					.map(
						(user) =>
							<EmbedFieldData>{
								name: user.name,
								value: `Rank: ${user.rank} Score: ${user.score}`,
							},
					),
			)
			.setTimestamp()
			.setFooter("NTM Discord Bot");
		ctx.channel.send({ embeds: [tsLeaderboardEmbed] });
	} else {
		const tsLeaderboardEmbed = new MessageEmbed()
			.setColor("#0099ff")
			.setTitle("NTM Town Star Weekly Competition")
			.setDescription("Listing of NTM players for the Town Star Weekly Competition")
			.addFields(
				tsLeaderboardUsers
					.filter((user) => user.name.toUpperCase().includes("NTM"))
					.map(
						(user) =>
							<EmbedFieldData>{
								name: user.name,
								value: `Rank: ${user.rank} Score: ${user.score}`,
							},
					),
			)
			.setTimestamp()
			.setFooter("NTM Discord Bot");
		ctx.channel.send({ embeds: [tsLeaderboardEmbed] });
	}
}

async function replyTownStarWeeklyScholar(ctx: Message<boolean>) {
	const tsLeaderboardUsers = await getTsWeeklyLeaderboard();
	if (!tsLeaderboardUsers) {
		ctx.channel.send("Unable to retrieve weekly leaderboard.");
		return;
	}

	const tsLeaderboardScholarEmbed = new MessageEmbed()
		.setColor("#0099ff")
		.setTitle("NTM Town Star Weekly Competition - Scholars")
		.setDescription("Listing of NTM scholars for the Town Star Weekly Competition")
		.addFields(
			tsLeaderboardUsers
				.filter((user) => user.name.toUpperCase().includes("NTM-S"))
				.map(
					(user) =>
						<EmbedFieldData>{
							name: user.name,
							value: `Rank: ${user.rank} Score: ${user.score}`,
						},
				),
		)
		.setTimestamp()
		.setFooter("NTM Discord Bot");

	ctx.channel.send({ embeds: [tsLeaderboardScholarEmbed] });
}

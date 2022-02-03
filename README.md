# NTM Gaming Team Discord Bot

This bot is built for the NTM Gaming Team's Discord server. It uses TypeScript, DiscordJS, Node 17+, PM2, lowdb and has
an appspec and Github action for deploying to AWS EC2.

## Bot Functionality

Supported Bot Commands:

Town Star Weekly

`!tsweekly searchTerm`
Displays the weekly leaderboard position for all towns with "searchTerm" in it (case insensitive).

- Example `!tsweekly ntm`

`!tscraft craftName totalAmount(optional)`
Displays the materials needed to craft "craftName" a "totalAmount" of times. Total amount must not exceed 1000 and is
not a required parameter.

- Example `!tscraft uniforms 120` or `!tscraft candy canes 150` or `!tscraft Blue_Steel 5`

Open Sea

`os-(collection-name) NFT Name`
Displays the OpenSea information for an item in the "collection-name" collection on OpenSea. Name must match the exact
name in OpenSea.

- Example, `!os-town-star Wheat Stand`

Supported Collections: `town-star`, `mirandus`, `spider-tanks`, `collectvox`, `collectvoxmirandus`

NOTE: Some of Gala's OpenSea collections are mixed up. For instance, the town-star collection has the Santa's Slay tanks
for Spider Tanks

Bot Help

`!bot-commands`
Displays the command help message

## Running locally

To run locally you will first need to install NodeJS and create
a [Discord bot](https://discord.com/developers/applications). Additionally you will need to have
a [Gala Games](https://app.gala.games/about) account and the ability to log into Town Star.

## Deployment

The bot is set up with GitHub actions and AWS to deploy to an EC2 server that has already been setup.

In the future this may become containerized for more ubiquitous deployments.

### Required environment variables

These environment variables should be kept private. Only set them up in a trusted environment.

- TOWNSTAR_SECRET
    - This can be acquired by first logging into [TownStar](https://app.gala.games/games/town-star/play/). Then use the
      developer console with the TownStar iframe selected, type `API.token`
- DISCORD_BOT_KEY
    - This is acquired when you setup your Discord bot

There may be a better way to retrieve this information and it may not be Town Star specific but this at least a way that
it works for me.

### Running the bot

```
yarn install
```

```
yarn start
```

Once your bot is up, it will need to be added to a server. You can use/create your personal (free) Discord server and
add it to that. Then you can issue the bot commands that the bot should parse and understand.

#### Running the bot with PM2

The bot can also be run with PM2 (this is what is done in production) so that it will automatically restart on failures.

```
yarn production-start
```

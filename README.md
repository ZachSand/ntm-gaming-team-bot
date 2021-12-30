# NTM Gaming Team Discord Bot

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

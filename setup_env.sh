#!/bin/bash

cd /home/ec2-user

# The bashrc on the server sources the .bashrc_ntm. There's probably a better way to do this..
rm .bashrc_ntm
touch .bashrc_ntm
echo DISCORD_BOT_KEY=${{ secrets.DISCORD_BOT_KEY }} >> /home/ec2-user/.bashrc_ntm
echo TOWNSTAR_SECRET=${{ secrets.TOWNSTAR_SECRET }} >> /home/ec2-user/.bashrc_ntm
echo TOWNSTAR_SESSION_ID=${{ secrets.TOWNSTAR_SESSION_ID }} >> /home/ec2-user/.bashrc_ntm
source /home/ec2-user/.bashrc

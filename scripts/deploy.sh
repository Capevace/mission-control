#!/bin/bash

git push

ssh deploy@home.mateffy.me -q -p 2221 << EOF
echo "Pulling changes for mission-control..."
cd /usr/local/src/hal/mission-control
git pull
git checkout master
sudo service mission-control restart
EOF
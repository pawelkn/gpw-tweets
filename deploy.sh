#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Error: Please provide a destination as a command line parameter."
    exit 1
fi

docker build -t gpw-tweets . &&
docker save gpw-tweets | bzip2 | pv | ssh $1 '
    docker load
    docker volume create mstall
    docker volume create images
    docker service rm gpw-tweets
    docker service create \
        --name gpw-tweets \
        --secret twitter-credentials \
        -e GPW_TWEETS_TWITTER_CREDENTIALS_FILE=/run/secrets/twitter-credentials \
        --mount source=mstall,target=/app/mstall \
        --mount source=images,target=/app/images \
        --read-only \
        gpw-tweets
'

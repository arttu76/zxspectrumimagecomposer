version=$(grep '"version":' package.json | cut -d '"' -f 4)
tag=$(date +"%d%b%Y")_$version

doctl registry login
docker tag zximage:latest registry.digitalocean.com/solvalou-docker/zximage:latest
docker tag zximage:latest registry.digitalocean.com/solvalou-docker/zximage:$tag

docker push registry.digitalocean.com/solvalou-docker/zximage:latest
docker push registry.digitalocean.com/solvalou-docker/zximage:$tag

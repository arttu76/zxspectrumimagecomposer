tag=`date +"%d%b%Y"`

doctl registry login
docker tag zximage:latest registry.digitalocean.com/solvalou-docker/zximage:latest
docker tag zximage:latest registry.digitalocean.com/solvalou-docker/zximage:$tag

docker push registry.digitalocean.com/solvalou-docker/zximage:latest
docker push registry.digitalocean.com/solvalou-docker/zximage:$tag

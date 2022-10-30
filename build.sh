docker network create bwg-net
docker build -t balancer --target balancer .
docker build -t bwg-s1 --target s1 .
docker build -t bwg-s2 --target s2 .
docker build -t bwg-s3 --target s3 .
docker build -t bwg-s4 --target s4 .
#!/bin/sh
set -e


echo "Waiting for MongoDB..."
for i in $(seq 1 30); do
  if nc -z mongo 27017 >/dev/null 2>&1; then
    echo "MongoDB is up!"
    break
  fi
  sleep 1
done


if [ -f prisma/schema.prisma ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi


exec "$@"
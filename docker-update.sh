#! /bin/bash

if docker-compose build; then
  if docker-compose run app ./update.sh; then
    echo
    echo "Docker environment updated successfully."
    exit 0
  fi
fi

echo
echo "Alas, something didn't work when trying to update your Docker setup."
echo "If you're not sure what the problem is, you might want to just "
echo "reset your environment by running:"
echo
echo "    docker-compose down -v"
echo "    $0"
echo
echo "Note that this may reset your database! It will also re-fetch"
echo "your package dependencies, among other things, so make sure you"
echo "have a good internet connection."

exit 1

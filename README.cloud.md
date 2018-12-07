## Running WoW in the cloud with Docker

WoW's Docker setup can also be used to deploy to cloud environments.

To do this, you'll first need to
[configure Docker Machine for the cloud][docker-machine-cloud],
which involves provisioning a host on a cloud provider and setting up
your local environment to make Docker's command-line tools use that
host. For example, to do this on Amazon EC2, you might use:

```
docker-machine create my-aws-sandbox --driver=amazonec2 --amazonec2-access-key=<your access key> --amazonec2-secret-key=<your secret key>
```

Then you'll want to load the host's configuration into
your environment, and point docker-compose to the cloud
compose file:

```
eval $(docker-machine env my-aws-sandbox)
export COMPOSE_FILE=docker-compose.cloud.yml
```

At this point you can use `docker` and `docker-compose`
and everything will run on the remote host.

Note that Docker Machine's cloud drivers intentionally don't support
folder sharing, which means that you can't just edit a file on
your local system and see the changes instantly on the remote host.
Instead, your app's source code is part of the container image.

However, the `nycdb` folder is mounted as a Docker volume,
so you can copy files to and from it with [`docker cp`][].

[docker-machine-cloud]: https://docs.docker.com/machine/get-started-cloud/

[`docker cp`]: https://docs.docker.com/engine/reference/commandline/cp/

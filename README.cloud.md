## Running WoW in the cloud with Docker

WoW's Docker setup can also be used to deploy to cloud environments.

To do this, you'll first need to
[configure Docker Machine for the cloud][docker-machine-cloud],
which involves provisioning a host on a cloud provider and setting up
your local environment to make Docker's command-line tools use that
host. For example, to do this on Amazon EC2, you might use:

```
docker-machine create my-sandbox --driver=amazonec2 --amazonec2-access-key=<your access key> --amazonec2-secret-key=<your secret key>
```

Then you'll want to load the host's configuration into
your environment, and point docker-compose to the cloud
compose file:

```
eval $(docker-machine env my-sandbox)
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

### Attaching/detaching Docker processes

It might be helpful to start long-running processes interactively
and then detach them so you can put your laptop to sleep and
check back on their progress later.

To do this, you can start an interactive shell:

```
docker-compose run --name=boop app bash
```

Note that the `--name=boop` specifies to name the container
`boop`. You can, of course, use a different name if you want.

Then once you have started some kind of long-running process,
press <kbd>Ctrl</kbd> + <kbd>p</kbd> followed by
<kbd>Ctrl</kbd> + <kbd>q</kbd> to detach it from your terminal.

To see the output of the process, you can run:

```
docker logs -f boop
```

The `-f` tells Docker to "follow" the logs, meaning it will
block for further output from your container, but you can press
<kbd>Ctrl</kbd> + <kbd>C</kbd> to abort it without terminating
the running process on the container.

If you want to continue using the process you started, you can also
re-attach your terminal to the container with:

```
docker attach boop
```

As with before, you can press <kbd>Ctrl</kbd> + <kbd>p</kbd>
followed by <kbd>Ctrl</kbd> + <kbd>q</kbd> to detach it from your 
terminal.

### Accessing the database

You can directly access the database of your instance at
port 5432 on the IP of the Docker host, which can be obtained
by looking at the value of `DOCKER_HOST` shown when you
run `docker-machine env my-sandbox`.

Note, however, that there might be a firewall in the way
that's put in place by the provider of your Docker host (e.g.,
Amazon Web Services). You'll have to bust a hole in that
firewall to access the database from your computer.

[docker-machine-cloud]: https://docs.docker.com/machine/get-started-cloud/

[`docker cp`]: https://docs.docker.com/engine/reference/commandline/cp/

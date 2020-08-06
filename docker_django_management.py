#!/usr/bin/env python

'''
    Docker Django Management v0.1

    This script/module makes it easier to allow developers to run
    your Django project in a docker container.

    Features:

    * A docker entrypoint always sets the docker user to the same uid
      as the owner of the directory your manage.py is in, ensuring that
      any files created by the docker container have appropriate
      permissions (i.e., deleting them does not require sudo).

    * Ctrl-C can be used during `docker-compose up` to quickly and
      gracefully exit.

    * `manage.py` always waits for the database to be up, ensuring
      there are no race conditions.

    * If Django isn't installed on the host system, `manage.py` can be
      used as a shortcut for `docker-compose run <your Django container's
      name> python manage.py`.

    * Friendly warnings are logged if anything seems to be misconfigured.

    Requirements:

    * The docker container this runs in should support the
      `useradd` command.

    To use it:

    * Place this script in the same directory as your Django project's
      manage.py file.

    * Change the following line of your manage.py file:

          from django.core.management import execute_from_command_line

      to:

          # If your Django container isn't called "app", change this line:
          os.environ.setdefault("DDM_CONTAINER_NAME", "app")

          from docker_django_management import execute_from_command_line

    * Merge the following into the configuration for your Django container
      in your docker-compose.yml:

          volumes:
            - .:/app
          working_dir: /app
          entrypoint: python /app/docker_django_management.py
          environment:
            - DDM_IS_RUNNING_IN_DOCKER=yup
            - PYTHONUNBUFFERED=yup
          command: python manage.py runserver 0.0.0.0:8000
          ports:
            - "8000:8000"

    You'll also want to make sure your docker-compose.yml configures
    your database and any other services properly, of course.

    Once everything is set up, developers can start your Django
    project via `docker-compose up`.

    Optional environment variables:

    * `DDM_HOST_USER` is the username as it will appear in the
      Docker container. It's purely for cosmetic purposes and
      defaults to `docker_user`.

    * `DDM_USER_OWNED_DIRS` is a list of paths that need to be
      owned by the `DDM_HOST_USER`, e.g. `/foo:/bar:/baz`. This
      can be useful if your configuration uses Docker volumes,
      which are owned by root by default. The entrypoint will
      change ownership if needed before anything is run.

    * `DDM_VENV_DIR` is the name of a directory in the container in
      which a Python virtualenv should exist. If the directory
      is empty when the entrypoint is run, a virtualenv will
      be created in it. The virtualenv is transparently
      activated before the entrypoint exec's.
'''

import os
import sys
import time
import signal
import subprocess

if sys.platform != 'win32':
    # If the Docker host is running on Windows, we don't need these
    # modules, so it's OK to not import them.
    import pwd
    import grp
else:
    pwd = None
    grp = None

if False:
    # This is just needed so mypy will work; it's never executed.
    from typing import Iterator, Any, List, Optional  # NOQA

# If the owner of the app directory on the Docker host is
# root, we're probably on Windows. So force a non-root user ID,
# as some of our tooling might not work when run as root.
DEFAULT_NON_ROOT_UID = 500

MY_DIR = os.path.abspath(os.path.dirname(__file__))
HOST_UID = os.stat(MY_DIR).st_uid or DEFAULT_NON_ROOT_UID

HOST_USER = os.environ.get('DDM_HOST_USER', 'docker_user')
USER_OWNED_DIRS = os.environ.get('DDM_USER_OWNED_DIRS', '')
VENV_DIR = os.environ.get('DDM_VENV_DIR', '')
CONTAINER_NAME = os.environ.get('DDM_CONTAINER_NAME')
IS_RUNNING_IN_DOCKER = 'DDM_IS_RUNNING_IN_DOCKER' in os.environ

# manage.py commands that are part of the static asset/i18n build
# pipeline.
BUILD_PIPELINE_MANAGEMENT_CMDS = [
    'collectstatic',
    'makemessages',
    'compilemessages',
]

# manage.py commands that don't require access to the database.
NO_DB_MANAGEMENT_CMDS = [
    *BUILD_PIPELINE_MANAGEMENT_CMDS,
    'help',
    '--help',
]


def is_running_dev_server(argv=sys.argv):  # type: (List[str]) -> bool
    '''
    Returns whether or not we are running the development
    server, e.g.:

        >>> is_running_dev_server(['manage.py', '--help'])
        False

        >>> is_running_dev_server(['manage.py', 'runserver'])
        True
    '''

    return get_management_command(argv) == 'runserver'


def get_management_command(argv=sys.argv):  # type: (List[str]) -> Optional[str]
    '''
    If manage.py is being run, returns the command name, or None
    otherwise, e.g.:

        >>> get_management_command(['boop.py'])
        >>> get_management_command(['manage.py', 'compilemessages'])
        'compilemessages'
    '''

    if len(argv) > 1 and os.path.basename(argv[0]) == "manage.py":
        return argv[1]
    return None


def info(msg):  # type: (str) -> None
    '''
    Prints a message.
    '''

    sys.stderr.write('{}\n'.format(msg))
    sys.stderr.flush()


def warn(msg):  # type: (str) -> None
    '''
    Prints a warning message in red.
    '''

    info(
        "\x1b[31;1m"  # Red
        "WARNING: " + msg + \
        "\x1b[0m"     # Reset colors
    )


def setup_docker_sigterm_handler():  # type: () -> None
    '''
    'manage.py runserver' is not set up to deal with a SIGTERM signal,
    and instead expects a Ctrl-C to come to its child process. So we'll
    add a SIGTERM handler here that finds all our children and gracefully
    shuts them down, which provides a quick graceful exit from Docker.
    '''

    def get_children():  # type: () -> Iterator[int]
        output = subprocess.check_output(
            "ps --ppid=%d -o pid | awk 'NR>1' | xargs echo" % os.getpid(),
            shell=True
        )
        return map(int, output.split())

    def handler(signum, frame):  # type: (int, Any) -> None
        for child_pid in get_children():
            try:
                os.kill(child_pid, signal.SIGTERM)
                os.waitpid(child_pid, 0)
            except OSError:
                pass
        sys.exit(0)

    info("Setting up Docker SIGTERM handler for quick, graceful exit.")
    signal.signal(signal.SIGTERM, handler)


def wait_for_db(max_attempts=15, seconds_between_attempts=1):
    # type: (int, int) -> None
    '''
    Some manage.py commands interact with the database, and we want
    them to be directly callable from `docker-compose run`. However,
    because docker may start the database container at the same time
    as it runs `manage.py`, we potentially face a race condition, and
    the manage.py command may attempt to connect to a database that
    isn't yet ready for connections.

    To alleviate this, we'll just wait for the database before calling
    the manage.py command.
    '''

    from copy import deepcopy
    from django.conf import settings
    from django.db import DEFAULT_DB_ALIAS, ConnectionHandler
    from django.db.utils import OperationalError

    # If we're using a PostGIS backend, we actually want to make a copy
    # of its config and change it to be a Postgres backend; otherwise
    # accessing the connection object will actually raise an
    # error because django.setup() hasn't yet been called, and we don't
    # want to call that because it messes with `manage.py runserver`. Oy!

    default_db_copy = deepcopy(settings.DATABASES[DEFAULT_DB_ALIAS])
    if default_db_copy['ENGINE'] == 'django.contrib.gis.db.backends.postgis':
        default_db_copy['ENGINE'] = 'django.db.backends.postgresql'
    connections = ConnectionHandler({DEFAULT_DB_ALIAS: default_db_copy})

    connection = connections[DEFAULT_DB_ALIAS]
    attempts = 0

    while True:
        try:
            connection.ensure_connection()
            break
        except OperationalError as e:
            if attempts >= max_attempts:
                raise e
            attempts += 1
            time.sleep(seconds_between_attempts)
            info("Attempting to connect to database.")

    connections.close_all()

    info("Connection to database established.")


def execute_from_command_line(argv):  # type: (List[str]) -> None
    '''
    This is like django.core.management.execute_from_command_line,
    but if the django package is unavailable, the script executes itself
    inside a docker container, where the django package is assumed
    to be available.

    Ultimately, this allows developers to use manage.py from their host
    system without needing to prefix all of their commands with
    'docker-compose run <container name>'.
    '''

    is_runserver = is_running_dev_server(argv)

    if IS_RUNNING_IN_DOCKER:
        if is_runserver:
            setup_docker_sigterm_handler()
        if get_management_command(argv) not in NO_DB_MANAGEMENT_CMDS:
            wait_for_db()

        if 'PYTHONUNBUFFERED' not in os.environ:
            warn("PYTHONUNBUFFERED is not defined. Some output may "
                 "not be visible.")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as e:
        if not CONTAINER_NAME:
            raise e
        # Assume the user wants to run us in docker.
        if is_runserver:
            # Even with --service-ports, by default runserver only exposes
            # itself on 127.0.0.1, which docker can't expose to the
            # host through its networking stack. It's easiest to just
            # tell the developer to use 'docker-compose up' instead.
            warn("You should probably be using 'docker-compose up' "
                 "to run the server.")
        try:
            cmd_name = 'docker-compose'
            cmd_args = [
                cmd_name, 'run', CONTAINER_NAME, 'python'
            ] + argv

            if sys.platform == 'win32':
                # Windows doesn't support the exec() syscall,
                # so run docker-compose in a subshell.
                # This will allow stdio to work as expected.
                return_code = subprocess.call(cmd_args)
                sys.exit(return_code)
            else:
                os.execvp(cmd_name, cmd_args)
        except OSError:
            # Apparently docker-compose isn't installed, so just raise
            # the original ImportError.
            raise e

    execute_from_command_line(argv)


def does_username_exist(username):  # type: (str) -> bool
    '''
    Returns True if the given OS username exists, False otherwise.
    '''

    try:
        if pwd:
            pwd.getpwnam(username)
        else:
            return False
        return True
    except KeyError:
        return False


def does_uid_exist(uid):  # type: (int) -> bool
    '''
    Returns True if the given OS user id exists, False otherwise.
    '''

    try:
        if pwd:
            pwd.getpwuid(uid)
        else:
            return False
        return True
    except KeyError:
        return False


def entrypoint(argv):  # type: (List[str]) -> None
    '''
    This is a Docker entrypoint that configures the container to run
    as the same uid of the user on the host container, rather than
    the Docker default of root. Aside from following security best
    practices, this makes it so that any files created by the Docker
    container are also owned by the same user on the host system.
    '''

    if sys.platform == 'win32':
        raise AssertionError(
            'This should only be called from within a '
            'unix-flavored Docker container!')

    gid = HOST_UID

    if HOST_UID != os.geteuid():
        user_owned_dirs = []  # type: List[str]

        if not does_uid_exist(HOST_UID):
            username = HOST_USER
            while does_username_exist(username):
                username += '0'
            home_dir = '/home/%s' % username
            extra_useradd_options = []  # type: List[str]

            if os.path.exists(home_dir):
                # The home directory already exists; just to be safe,
                # let's make sure it's owned by our UID.
                user_owned_dirs.append(home_dir)
            else:
                # The home directory doesn't already exist, so tell
                # useradd to make it for us.
                extra_useradd_options.append('-m')

            subprocess.check_call([
                'useradd',
                '-d', home_dir,
                username,
                '-u', str(HOST_UID)
            ] + extra_useradd_options)
            gid = grp.getgrnam(username).gr_gid

        if USER_OWNED_DIRS:
            user_owned_dirs += USER_OWNED_DIRS.split(os.path.pathsep)

        for dirname in user_owned_dirs:
            subprocess.check_call([
                'chown',
                '{}:{}'.format(HOST_UID, gid),
                dirname
            ])

        if pwd is not None:
            os.environ['HOME'] = '/home/%s' % pwd.getpwuid(HOST_UID).pw_name
        os.setgid(gid)
        os.setuid(HOST_UID)

    if VENV_DIR:
        activate_this = os.path.join(VENV_DIR, 'bin/activate_this.py')

        if not os.path.exists(activate_this):
            subprocess.check_call([
                'virtualenv',
                '.',
            ], cwd=VENV_DIR)

        # https://virtualenv.pypa.io/en/latest/userguide.html
        with open(activate_this) as f:
            exec(f.read(), dict(__file__=activate_this))

    os.execvp(argv[1], argv[1:])


if __name__ == "__main__":
    entrypoint(sys.argv)

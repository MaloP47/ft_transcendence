# ft_transcendence
Last 42 common core project

Clean 
```sh
sudo apt-get clean
sudo apt-get autoremove
sudo apt-get purge $(dpkg -l | awk '/^rc/ { print $2 }')
sudo rm -rf /var/cache/*
sudo journalctl --vacuum-time=1d
rm -rf ~/.local/share/Trash/*
```

# Changelog
Put here changes that will impact project mates
### 2024-07-01
- moved all sources from `srcs/requirements` to `services`
- added a few makefile rule aliases like `make down` which is the same as `make stop`
- removed all `--no-print-directory` in favor of a `MAKEFLAGS` approach

# FAQ
### Why specific version of docker image instead of `latest`?
- Prevents random non functioning project in the future, for example, during the evaluation if image has changed

# TODO
### Project Structure
- [x] rename requirements to services, meaning make changes to docker-compose.yml file and makefile
- [x] Move things out of `services/`
- Makefile
    - [x] changing `echo` for `printf` (for POSIX portability)
    - [x] find better solution to --no-print-directory to put rules in deps instead
    - [ ] use docker compose to clean containers instead of normal docker
    - [ ] remove django migrations and put it in startup script in container or dockerfile
- [ ] docker volumes bind-mounts inside `data` folder at project root for the ones needed, (yeah we don't need persistence but it would be nice for demonstrations and debugging)
- [ ] remove `mkdirs` rule
- [ ] look more into docker `secrets` for all passwords, tokens and API keys
- [ ] look more into the concept of init containers in combination with docker secrets
### Django
- [ ] database migration command
    - [ ] move into Dockerfile setup? or mounted bash script
    - [ ] wait for postgres to be up for migrations? 
- [ ] move debug logs to a volume or smth (ask guillaume)
### postgres
- [x] WARNING: POSTGRES_HOST_AUTH_METHOD has been set to "trust". This will allow anyone with access to the Postgres port to access your database without a password, even if POSTGRES_PASSWORD is set. See PostgreSQL documentation about "trust":

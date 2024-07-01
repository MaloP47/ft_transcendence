# ft_ranscendence
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
- Prevents random non functioning project in the future, for example, during the evaluation

# TODO
- [ ] Make better README.md later
### Project Structure
- [x] Move things out of `services/`
- [x] rename requirements to services or containers, meaning make changes to docker-compose.yml file
- Makefile
    - [x] changing `echo` for `printf` (for POSIX portability)
    - [x] find better solution to --no-print-directory to put rules in deps instead
    - [ ] use docker compose to clean containers instead of normal docker
    - [ ] remove django migrations and put it in startup script in container or dockerfile
- [ ] docker volumes bind-mounts inside `data` folder at project root for the ones needed, yes we don't need persistence but it would be nice for demonstrations
- [ ] remove `mkdirs` rule
- [ ] look more into docker `secrets` for all passwords, tokens and API keys
### Prometheus
- [x] check out rule files
- [x] `evaluation_interval`? difference with `scrap_interval`
- [x] check out /metrics endpoint
- [ ] config file permissions aren't working, check userid and groupid solutions
- [ ] grafana marked down for some reason, check scrape config
- [ ] change alert rules, install blackbox_exporter
### Django
- [ ] database migration command
    - [ ] move into Dockerfile setup? or mounted bash script
    - [ ] wait for postgres to be up for migrations? 
- [ ] move debug logs to a volume or smth (ask guillaume)
### Rabbitmq
- [ ] config file creates container error and exits
### postgres
- [x] WARNING: POSTGRES_HOST_AUTH_METHOD has been set to "trust". This will allow anyone with access to the Postgres port to access your database without a password, even if POSTGRES_PASSWORD is set. See PostgreSQL documentation about "trust":
### postgres_exporter
- [x] Error loading config" err="Error opening config file \"postgres_exporter.yml\": open postgres_exporter.yml: no such file or directory"
### filebeat
- [x] move var-log to a proper volume, maybe `data` folder in project root dir (daddy gpt says so)
### alertmanager
- [ ] find better way of putting webhooks into config file without exposing it
    - env variables are bad, so is ARG in dockerfile
    - this extends to this entire project actually for other passwords
    - docker secrets might be a good option but still require to be used after or during the entrypoint so it doesn't help when you need a password during the build
- [ ]  with args method it's even worse because docker compose will prioritize shell env variables instead of env file

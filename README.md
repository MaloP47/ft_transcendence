sudo apt-get clean
sudo apt-get autoremove
sudo apt-get purge $(dpkg -l | awk '/^rc/ { print $2 }')
sudo rm -rf /var/cache/*
sudo journalctl --vacuum-time=1d
rm -rf ~/.local/share/Trash/*



TO DO LIST:
Cote conteneurs :





Done :
postgres_exporter :
Error loading config" err="Error opening config file \"postgres_exporter.yml\": open postgres_exporter.yml: no such file or directory"

postgres :
WARNING: POSTGRES_HOST_AUTH_METHOD has been set to "trust". This will allow
         anyone with access to the Postgres port to access your database without
         a password, even if POSTGRES_PASSWORD is set. See PostgreSQL
         documentation about "trust":

# TODO (noa)
- Questions for team:
    - [ ] why choose specific version of grafana instead of `latest`
### Project Structure
- [ ] Move things out of `srcs/`
- [ ] rename requirements to services or containers, meaning make changes to docker-compose.yml file
- Makefile
    - [x] changing `echo` for `printf` (for POSIX portability)
    - [x] find better solution to --no-print-directory to put rules in deps instead
    - [ ] use docker compose to clean containers instead of normal docker
    - [ ] remove django migrations and put it in startup script in container or dockerfile
### Prometheus
- [x] check out rule files
- [x] `evaluation_interval`? difference with `scrap_interval`
- [x] check out /metrics endpoint
### Django
- [ ] database migration command
    - [ ] move into Dockerfile setup? or mounted bash script
    - [ ] wait for postgres to be up for migrations? 

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
### Project Structure
- [ ] Move things out of `srcs/`
- [ ] rename requirements to services or containers, meaning make changes to docker-compose.yml file
### Prometheus
- [x] check out rule files
- [ ] `evaluation_interval`? difference with `scrap_interval`
- [x] check out /metrics endpoint

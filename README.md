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

# TODO
### STUFF TO FIX
- [ ] dropdown for logout and profile buttons not working
- [ ] grafana showing django as down even though it's not

### Merge ask guillaume
- [ ] in `services/django/app/requirements.txt` set a version for django-prometheus dependence to avoid errors at new version during correction
- [ ] `logstash` and `kibana` take 10 seconds to close, probably SIGTERM issue, fixes: `exec` at the end of entrypoint script or similar, needs to be pid 1
- [ ] `grafana` change admin password


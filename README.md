```bash
sudo apt-get clean
sudo apt-get autoremove
sudo apt-get purge $(dpkg -l | awk '/^rc/ { print $2 }')
sudo rm -rf /var/cache/*
sudo journalctl --vacuum-time=1d
rm -rf ~/.local/share/Trash/*
```

# File structure
```
.
├── .gitignore
├── docker-compose.yml
├── Makefile
├── README.md
└── srcs
    ├── services
    │   ├── django
    │   │   ├── app
    │   │   └── Dockerfile
    │   ├── grafana
    │   │   └── conf
    │   ├── nginx
    │   │   ├── conf
    │   │   └── Dockerfile
    │   └── prometheus
    │       └── conf
    └── tools
        ├── check_dotenv.sh
        └── install_docker.sh
```

# TODO
### Makefile
- [ ] Unify django manage commands in one rule (use arguments or a script, idk yet)
- [x] Update phony rules
- [ ] Change echo for printf (portability of colors, posix)
- [ ] Check difference ${} $() $ for variables (i forgor)
- [ ] Why use --no-print-diretory?

### Docker
- [ ] Check what needs to be added to .gitignore (.env, etc)
- [ ] different .env files for each container, only include things they need (maybe?)
- Nginx:
    - [ ] relation with wsgi and django?
    - [ ] gunicorn?

### .env Manager
- [ ] choose what language to make manager (bash or something else?)
- [ ] verify existence of all needed environment variables in .env file
- [ ] prompts to create .env if it doesn't exist

> [!IMPORTANT]
> Todo list will evolve, this is just a start

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
### Stuff to fix (not my work)
- [ ] music error message when doing nothing `Autoplay was prevented: DOMException: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD` `music.js:14`
- [ ] logout button not working because of music button
    - TODO: remove temporary logout button from `templates/navbar.html`, and uncomment music.js but first fix the constant loop trying to play it
- [ ] does forfeiting a game mark it as over?
- [ ] join button not working? no error in chrome console
- [ ] nginx 10s to close (not critical but worth investigating)
### Stuff to fix (my work)
- [x] refreshing multi config page gives `Page not found (404)`
    - FIX: forgot to add `/multi` to urls path, not sure why it was working at all, probably because page is static
- [x] play button in multi config redirecting to normal game
### Multiplayer
- Stuff to create:
    - in `views.py`: (not right file name)
        - [x] `multiConfig()`
        - [x] added `gameType` to `getGame()`
        - [ ] for multiplayer, only host should be allowed to save game
    - in `urls.py`:
        - [x] `/api/view/multiConfig/`
        - [x] `/api/game/new/multi/`
    - in `StateMachine.js`:
        - [x] `getMultiConfigPage()`
        - [x] `getMultiGame()`
        - [x] `setMultiConfigInteraction()`
        - [ ] in Multiplayer config use `Name` field and custom search, no fancy list of matching names, shake red (like wrong password in login form, if player doesn't exist
    - in `templates`:
        - [x] `website/multiConfig.html`
            - [?] add opponent selector like in tournament creator
    - in `consumer.py`:
        - [ ] receive method seems to do everything, no if checks for type, ask guillaume
        - [ ] receive data in a smarter way for hostGameInfo only using a `type` field as a proof of concept
    - in `Pong.js`:
        - [ ] ask guillaume why `gameType` is not reset in `resetGameInfo()` and `toState()`
            - I believe its causing some issues at the end of games
        - lots of multi utils functions added
        - [ ] variable that holds multi game info/data, `multiData`
            - These functions should set `multiData` properly if needed
                - [ ] `initGameVariable()`
                - [ ] `resetGameInfo()`
                - [ ] `toState()`
                - [ ] `preConfig()`
                - [ ] `postConfig()`
    - in `ImpactParticles.js`:
        - [ ] Particles dont always trigger or in the wrong place when ball resets
        - [ ] bonuses seem to fuck up the particles on the guest
        - [x] oooooh ball position is sent at the end of the loop but not particle creation
        - [ ] now collisions are in good location but sometimes just dont happen... fix later

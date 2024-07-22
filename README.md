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
- [ ] remove temporary logout button from `templates/navbar.html`
- [ ] uncomment music.js but first fix the constant loop trying to play it
### Bugs
- Severe:
    - [ ] Connecting from another pc, not localhost give 403 error
    - [ ] music error message when doing nothing `Autoplay was prevented: DOMException: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD` `music.js:14`
    - [ ] logout button not working because of music button
- Moderate:
    - [ ] notif join button not working? no error in chrome console
- Minor:
    - [ ] when refreshing host particles stay on guest
    - [ ] sometimes there's an AI in multi game, not sure how to recreate
    - [ ] nginx 10s to close (not critical but worth investigating)
### Multiplayer
- multi config page:
    - [ ] fix small field size when nothing inside
    - [ ] player search field:
        - [ ] should transform into field like player 1 when player chosen but remain clickable afterwards
        - [ ] upon hovering show `X` button
        - [ ] bring that same style to tournament creation, 4 empty fields that fill up 
        - [ ] find way to make field big even when innerHtml is "" nothing
    - [ ] don't send notification to host on creation if regular multi game (not tournament)
- tournament config page:
    - [ ] send notification to everyone
- multiplayer game management (notifs and list):
    - [ ] should notif also be sent to host? -> in tournament creation yes, otherwise no
    - [ ] `listGameInvite` view that shows list of games you're allowed to join (in case you miss the notif)
    - [ ] `Cancel Match` button that deletes normal multiplayer games
    - [ ] `Forfeit Match` button that forfeits tournament multiplayer games
- multiplayer game:
    - [x] update score remotely
    - [x] countdown
    - [x] trigger `player` wins this game! text
    - [x] redirect home if not allowed to see a game
    - [x] game creation select player with searchPlayer in stateMachine (started making template already), need to change buttons behavior
    - [x] when p2 is handled remove public access to games, no more spectators (in `views.py`), `isSpectator()`
    - [ ] reloading finished game:
        - [ ] Problem 1: if host reloads his finished game it will be an AI background game but game data will be broadcasted
        - [ ] Problem 2: countdown stays on screen for some reason on guest
    - [ ] add a `Waiting for {{p2.name}}...` on same field as countdown when user is not here
    - player disconnection after match start?:
        - [ ] make pause menu
        - [ ] resume game in terrain center and start countdown
        - [ ] if guest disconnects, pause game wait for reconnection, after 15 seconds give option to cancel match
        - [ ] if host disconnects, pause game, after 15 seconds give option to cancel match
        - [ ] if it's a tournament, declare no winner, next match in tournament is a win by forfeit
    - [ ] guest perspective:
        - [ ] rotate game field 180 degrees
        - [ ] invert inputs if `isMultiGuest()`
        - [ ] dont invert colors, keep player1 red and player2 green
        - [ ] need to interpolate too
- in `consumer.py`:
    - [x] receive data in a smarter way for hostGameInfo only using a `type` field as a proof of concept
    - [ ] receive method seems to do everything, no if checks for type, ask guillaume
- [ ] ask guillaume about `gameType`, `resetGameInfo()` and `toState()`
    - I believe its causing some issues at the end of games and on page refresh
    - These functions should set `gameType` and `multiData` properly if needed:
        - [ ] `initGameVariable()`
        - [ ] `resetGameInfo()`
        - [ ] `toState()`
        - [ ] `preConfig()`
        - [ ] `postConfig()`

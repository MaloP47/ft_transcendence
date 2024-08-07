// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   StateMachine.js                                    :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/07/22 11:54:11 by gbrunet           #+#    #+#             //
//   Updated: 2024/07/22 21:52:23 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import Pong from '../pong/Pong.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class App {
	constructor() {
		this.preventLinkDefaultBehavior();
		window.onpopstate = function(e) {
			this.router(true);
		}.bind(this);
		this.initRoutes();
		this.initUser();
		this.updateUser();
		this.router();
	}

	preventLinkDefaultBehavior() {
		window.addEventListener("click", e => {
			if (e.target.matches("[data-api]")) {
				e.preventDefault();
				this.getApiResponse(e.target.dataset.api).then((response) => {
					history.pushState("", "", e.target.href);
					let res = JSON.parse(response)
					if (res.needUserUpdate) {
						this.updateUser();
						this.chatSocket.send(JSON.stringify({
							'updateFriends': true
						}));
					}
				});
			}
			else if (e.target.matches("[data-link]")) {
				e.preventDefault();
				history.pushState("", "", e.target.href);
				this.router();
			}
		});
	}

	initRoutes() {
		this.routes = {
			"/": {title: "Transcendence", state: "Home"},
			"/login": {title: "Transcendence - Login", state: "Login"},
			"/register": {title: "Transcendence - Register", state: "Register"},
			"/play1vsAI": {title: "Transcendence - 1 VS A.I.", state: "Play1vsAI"},
			"/play1vs1": {title: "Transcendence - 1 VS 1 (local)", state: "Play1vs1"},
			"/multi": {title: "Transcendence - 1 VS 1 (multiplayer)", state: "PlayMulti"},
			"/listTournaments": {title: "Transcendence - Tournaments", state: "listTournaments"},
			"/createTournaments": {title: "Transcendence - Tournament creation", state: "createTournaments"},
			"/profile": {title: "Transcendence - Profile", state: "Profile"},
		}
	}

	initUser() {
		this.user = {
			authenticated: false,
			username: "",
			id: undefined,
		};
	}

	updateUser() {
		let prev = this.user.authenticated;
		if (this.getCookie('csrftoken') == null) {
			this.user.authenticated = false;
			this.user.username = "";
			this.user.id = undefined;
			return ;
		}
		this.getApiResponse("/api/user/").then((response) => {
			let user = JSON.parse(response);
			if (user.authenticated) {
				this.user.authenticated = true;
				this.user.username = user.username;
				this.user.id = user.id;
			}
			else {
				this.user.authenticated = false;
				this.user.username = "";
				this.user.id = undefined;
			}
			if (prev != this.user.authenticated)
				this.toggleProfilMenu();
			this.router();
		});
	}

	hideAll() {
		if (document.getElementById("registerForm"))
			this.hideRegisterForm();
		if (document.getElementById("loginForm"))
			this.hideLoginForm();
		if (document.getElementById("createGame"))
			this.hideCreateGame();
		if (document.getElementById("listTournaments"))
			this.hideListTournaments();
		if (document.getElementById("gameOverlay"))
			this.hideLocalGame()
		if (document.getElementById("aiConfig"))
			this.hideAiConfig()
	}

	router(back) {
		this.path = String(location.pathname)
		this.id = -1
		if (this.path.indexOf("/play1vsAI/") == 0) {
			this.id = this.path.substring(11)
			this.path = "/play1vsAI"
		} else if (this.path.indexOf("/play1vs1/") == 0) {
			this.id = this.path.substring(10)
			this.path = "/play1vs1"
		} else if (this.path.indexOf("/multi/") == 0) {
			this.id = this.path.substring(7)
			this.path = "/multi"
		} else if (this.path.indexOf("/profile/") == 0) {
			this.id = this.path.substring(9)
			this.path = "/profile"
		} else if (this.path.indexOf("/getTournament/") == 0) {
			this.id = this.path.substring(15)
			this.path = "/listTournaments"
		}
		let view = this.routes[this.path];
		if (view) {
			document.title = view.title;
			this.hideAll();
			this.checkNotification();
			this.addNotificationEvents();
			switch(view.state) {
				case "Home":
					this.getHomePage("home");
					break;
				case "Login":
					this.getLoginForm();
					break;
				case "Register":
					this.getRegisterForm();
					break;
				case "Play1vsAI":
					this.getHomePage("1vsAI", this.id);
					break;
				case "Play1vs1":
					this.getHomePage("1vs1", this.id);
					break;
				case "Profile":
					this.getHomePage("profile", this.id);
					break;
				case "PlayMulti":
					this.getHomePage("multi", this.id);
					break;
				case "listTournaments":
					this.getHomePage("listTournaments", this.id);
					break;
				case "createTournaments":
					this.getHomePage("createTournaments", this.id);
					break;
			}
		} else {
			history.replaceState("", "", "/");
			this.router();
		}
	}

	// -----------------------------------------------------------
	// ----------------- DJANGO-JS COMMUNICATION -----------------
	// -----------------------------------------------------------

	getCookie(name) {
		let cookieValue = null;
		if (document.cookie && document.cookie !== '') {
			const cookies = document.cookie.split(';');
			for (let i = 0; i < cookies.length; i++) {
				const cookie = cookies[i].trim();
				if (cookie.substring(0, name.length + 1) === (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookieValue;
	}

	makeApiRequest(url, data) {
		let csrf = this.getCookie('csrftoken');
		return new Promise(function (resolve, reject) {
			let xhr = new XMLHttpRequest();
			xhr.open("POST", url);
			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					resolve(xhr.response);
				} else {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
				}
			};
			xhr.onerror = function () {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			};
			xhr.setRequestHeader("X-CSRFToken", csrf);
			if (data != undefined)
				xhr.send(data)
			else
				xhr.send();
		}.bind(this));
	}

	async getApiResponse(url, data) {
		return await this.makeApiRequest(url, data);
	}

	makeApiRequestJson(url, json) {
		let csrf = this.getCookie('csrftoken');
		return new Promise(function (resolve, reject) {
			let xhr = new XMLHttpRequest();
			xhr.open("POST", url);
			xhr.onload = function () {
				if (this.status >= 200 && this.status < 300) {
					resolve(xhr.response);
				} else {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
				}
			};
			xhr.onerror = function () {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			};
			xhr.setRequestHeader("X-CSRFToken", csrf);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhr.send("data=" + encodeURIComponent(JSON.stringify(json)));
		}.bind(this));
	}

	async getApiResponseJson(url, json) {
		return await this.makeApiRequestJson(url, json);
	}

	// ---------------------------------------------------------
	// ---------------------- VIEW UPDATE ----------------------
	// ---------------------------------------------------------

	setPong(state) {
		if (!this.pong)
			this.pong = new Pong({stateMachine: this, state: state});
		else
			this.pong.toState(state);
	}

	toggleProfilMenu() {
		let profilMenu = document.getElementById("profilMenu");
		if (this.user.authenticated) {
			this.getApiResponse("/api/view/profileMenu/")
				.then((response) => {
					let res = JSON.parse(response);
					if (res.success) {
						profilMenu.innerHTML = res.html;
						profilMenu.classList.remove("hided");
					}
				})
		} else {
			profilMenu.classList.add("hided");
			setTimeout(() => {
				profilMenu.innerHTML = "";
			}, 200);
		}
	}

	remove(domId) {
		let dom = document.getElementById(domId);
		if (dom)
			dom.remove();
	}

	empty(domId) {
		setTimeout(() => {
			let dom = document.getElementById(domId);
			if (dom)
				dom.innerHTML = "";
		}, 200);
	}

	displayNone(domId) {
		setTimeout(() => {
			let dom = document.getElementById(domId);
			if (dom)
				dom.classList.add("displayNone");
		}, 200);
	}

	getHomePage(state, game_id) {
		if (game_id == undefined)
			game_id = -1;
		if (this.user.authenticated) {
			if (this.chatSocket)
				this.chatSocket.close();
			this.chatSocket = new WebSocket(
				'wss://' + window.location.host + '/ws/chat/'
			);

			this.chatSocket.onmessage = function(e) {
				const data = JSON.parse(e.data);
				if (data.need_update) {
					this.updateConnectedUsers();
					this.updateRooms();
				}
				if (data.message)
					this.handleNewMessage(data);
				if (data.friendRequest)
					this.handleFriendRequestMessage(data);
				if (data.game_notif)
					this.handleTournamentNotif(data);
				if (data.type && (data.type == 'multiDataHost' || data.type == 'multiDataGuest')) {
					if (data.data.game_id == game_id && this.pong)
						this.pong.handleMultiData(data.type, data.data); // not sure how safe it is to access pong like that
				}
			}.bind(this);
		}

		if (!document.getElementById("homeView") || !this.user.authenticated) {
			this.getApiResponse("/api/view/home/").then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					let topContent = document.getElementById("topContent");
					topContent.innerHTML = res.html;
					this.initHideMenusOnBgClick();
					this.displayChat("Public");
					this.addNotificationEvents();
					this.initAddFriendBtn();
					this.initDeleteFriendBtn();
					this.initViewProfileBtn();
					this.updateRooms();
					if (state == "home") {
						this.setPong("bg");
						this.getCreateGame();
					} else if (state == "1vsAI" && !this.user.authenticated) {
						history.replaceState("", "", "/");
						this.router();
					} else if (state == "1vsAI" && game_id == -1) {
						this.setPong("bg");
						this.getLocalAiConfigPage();
					} else if (state == "1vsAI" && game_id != -1) {
						this.getLocalAiGame(game_id);
					} else if (state == "1vs1" && !this.user.authenticated) {
						history.replaceState("", "", "/");
						this.router();
					} else if (state == "1vs1" && game_id == -1) {
						this.setPong("bg");
						this.getLocalConfigPage();
					} else if (state == "1vs1" && game_id != -1) {
						this.getLocalGame(game_id);
					} else if (state == "multi" && !this.user.authenticated) {
						history.replaceState("", "", "/");
						this.router();
					} else if (state == "multi" && game_id == -1) {
						this.setPong("bg");
						this.getMultiConfigPage();
					} else if (state == "multi" && game_id != -1) {
						this.getMultiGame(game_id);
					} else if (state == "listTournaments") {
						this.setPong("bg");
						this.getListTournaments(game_id);
					} else if (state == "createTournaments") {
						this.setPong("bg");
						this.getCreateTournament();
					} else if (state == "profile") {
						this.setPong("bg");
						this.getProfile(game_id);
					}
					let homeView = document.getElementById("homeView");
					setTimeout(() => {
						homeView.classList.remove("hided");
					}, 15);
				}
			})
		} else {
			if (state == "home") {
				this.setPong("bg");
				this.getCreateGame();
			} else if (state == "1vsAI" && game_id == -1) {
				this.setPong("bg");
				this.getLocalAiConfigPage();
			} else if (state == "1vsAI" && game_id != -1) {
				this.getLocalAiGame(game_id);
			} else if (state == "1vs1" && game_id == -1) {
				this.setPong("bg");
				this.getLocalConfigPage();
			} else if (state == "1vs1" && game_id != -1) {
				this.getLocalGame(game_id);
			} else if (state == "profile") {
				this.setPong("bg");
				this.getProfile(game_id);
			} else if (state == "multi" && game_id == -1) {
				this.setPong("bg");
				this.getMultiConfigPage();
			} else if (state == "multi" && game_id != -1) {
				this.getMultiGame(game_id);
			} else if (state == "listTournaments") {
				this.getListTournaments(game_id);
			} else if (state == "createTournaments") {
				this.getCreateTournament();
			}
		}
	}

	checkNotification() {
		this.getApiResponse("/api/game/unfinished/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				for (let i in res.games) {
					this.getApiResponse("/api/game/notif/" + res.games[i].pk).then((re) => {
						let r = JSON.parse(re);
						if (r.success) {
							let notifs = document.getElementsByClassName("notification")
							var show = true;
							for (let j in notifs){
								if (notifs[j].dataset && notifs[j].dataset.game
									&& parseInt(notifs[j].dataset.game) == res.games[i].pk) {
									show = false;
									break;
								}
							}
							if (show) {
								let notificationCenter = document.getElementById("notif")
								if (notificationCenter) {
									notificationCenter.innerHTML += r.html;
									this.addNotificationEvents();
								}
							}
						}
					});
				}
			}
		});
	}

	getCreateTournament() {
		let homeContent = document.getElementById("homeContent");
		if (!homeContent)
			return ;
		this.getApiResponse("/api/view/tournamentConfig/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				homeContent.innerHTML += res.html;
				setTimeout(() => {
					let configView = document.getElementById("config");
					if (!configView)
						return ;
					configView.classList.remove("hided");
					this.setTournamentConfigInteraction();
				}, 200);
			}
		});
	}

	setTournamentConfigInteraction() {
		let config = {
			winScore: 10,
			startSpeed: 8,
			bonuses: true,
		}
		this.tournamentPlayers = []
		let configView = document.getElementById("config");
		if (configView.dataset.events != "done") {
			configView.dataset.events = "done";
			let winScore = document.getElementById("winScore");
			let winScoreText = document.getElementById("winScoreText");
			winScore.addEventListener('input', (e) => {
				winScoreText.innerHTML = winScore.value;
				config.winScore = winScore.value;
			});
			let startSpeed = document.getElementById("startSpeed");
			let startSpeedText = document.getElementById("startSpeedText");
			startSpeed.addEventListener('input', (e) => {
				startSpeedText.innerHTML = startSpeed.value;
				config.startSpeed = startSpeed.value;
			});
			if (document.querySelector('input[name="bonuses"]')) {
				document.querySelectorAll('input[name="bonuses"]').forEach((elem) => {
					elem.addEventListener("change", function(event) {
						if (event.target.value == 'on')
							config.bonuses = true;
						else
							config.bonuses = false;
					});
				});
			}
			document.getElementById("addPlayer").addEventListener("keyup", (e) => {
				let val = document.getElementById("addPlayer").value;
				if (val != "")
					this.searchPlayer(val);
				else {
					let playerResult = document.getElementById("playerResult");
					if (playerResult)
						playerResult.innerHTML = "";
				}
			})
			let createBtn = document.getElementById("createBtn")
			createBtn.addEventListener("click", (e) => {
				this.getApiResponseJson("api/tournament/create/", {config: config, players: this.tournamentPlayers}).then((response) => {
					let res = JSON.parse(response);
					if (res.success) {
						let tourConfig = document.getElementById("config");
						tourConfig.classList.add("hided")
						this.chatSocket.send(JSON.stringify({
							'gameNotif': res.g1,
							'p1': res.p1,
							'p2': res.p2,
						}));
						this.chatSocket.send(JSON.stringify({
							'gameNotif': res.g2,
							'p1': res.p3,
							'p2': res.p4,
						}));
						setTimeout(() => {
							this.remove("config")
							history.pushState("", "", "/");
							this.router();
						}, 100)
					}
				});
			});
		}
	}

	searchPlayer(val) {
		this.getApiResponseJson("/api/tournament/playerSearch/", {search: val}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let playerResult = document.getElementById("playerResult");
				if (playerResult)
					playerResult.innerHTML = res.html;
				let btns = playerResult.getElementsByClassName("btn");
				for (let i = 0; i < btns.length; i++) {
					if (this.tournamentPlayers.find((elem) => elem.id == btns[i].dataset.id)) {
						btns[i].disabled = true;
						continue;
					}
					btns[i].addEventListener("click", (e) => {
						if (this.tournamentPlayers.find((elem) => elem.id == btns[i].dataset.id))
							return ;
						this.tournamentPlayers.push({
							id: btns[i].dataset.id,
							name: btns[i].dataset.name,
						})
						this.updatePlayerList();
						setTimeout(()=>{
							this.configureDeleteTournamentPlayers()
						}, 100)
					})
				}
			}
		});
	}
	searchPlayerMulti(val) {
		// prevent adding yourself as an opponent
		// - custom `/api/multi/playerSearch` view, dont show in results
		// - protect /api/game/new/multi from putting same person against each other, send back not success
		this.getApiResponseJson("/api/tournament/playerSearch/", {search: val}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let playerResult = document.getElementById("playerResult");
				if (playerResult)
					playerResult.innerHTML = res.html;
				let btns = playerResult.getElementsByClassName("btn");
				for (let i = 0; i < btns.length; i++) {
					// disable button if same as host, can't play against yourself
					if (this.user.id == btns[i].dataset.id) {
						btns[i].disabled = true;
						continue;
					}
					btns[i].addEventListener("click", (e) => {
						if (this.user.id == btns[i].dataset.id)
							return ;
						this.playerMulti = {
							id: btns[i].dataset.id,
							name: btns[i].dataset.name,
						}
						this.updatePlayerMulti(); // change field 
					})
				}
			}
		});
	}

	updatePlayerList() {
		document.getElementById("addPlayer").value = "";
		let playerResult = document.getElementById("playerResult");
		if (playerResult)
			playerResult.innerHTML = "";
		//nbPlayer = document.getElementById("nbPlayer");
		var nbPlayer = document.getElementById("nbPlayer");
		nbPlayer.innerHTML = this.tournamentPlayers.length;
		var html = "";
		for (let j = 0; j < this.tournamentPlayers.length; j++) {
			html += '<div id="player-' + this.tournamentPlayers[j].id + '" class="px-1 mx-1 border border-light rounded" style="--bs-border-opacity:0.25;">' + this.tournamentPlayers[j].name + '<button data-id="' + this.tournamentPlayers[j].id + '" class="btn btn-light delPlayerList" style="line-height: 12px; font-size:12px; padding: 0 4px 0 4px; margin-left: 8px">x</button></div>'
		}
		var players = document.getElementById("players");
		players.innerHTML = html;
		var createBtn = document.getElementById("createBtn");
		var addPlayerInput = document.getElementById("addPlayer");
		if (this.tournamentPlayers.length == 4) {
			createBtn.disabled = false;
			addPlayerInput.disabled = true;
		} else {
			createBtn.disabled = true;
			addPlayerInput.disabled = false;
		}
	}

	updatePlayerMulti() {
		let addPlayer = document.getElementById("addPlayer");
		addPlayer.value = "";
		let playerResult = document.getElementById("playerResult");
		if (playerResult)
			playerResult.innerHTML = "";
		if (this.playerMulti != 0) {
			addPlayer.placeholder = this.playerMulti.name;
		}
		else {
			addPlayer.placeholder = "Search";
		}
		var playBtn = document.getElementById("playBtn");
		if (this.playerMulti != 0) {
			playBtn.disabled = false;
		} else {
			playBtn.disabled = true;
		}
	}

	configureDeleteTournamentPlayers() {
		var addPlayerInput = document.getElementById("addPlayer");
		let btns = document.getElementsByClassName("delPlayerList");
		for (let i in btns) {
			if (btns[i].type == 'submit') {
				btns[i].addEventListener("click", (e) => {
					this.tournamentPlayers =
						this.tournamentPlayers.filter((item) => item.id != btns[i].dataset.id)
					this.updatePlayerList()
					setTimeout(()=>{
						this.configureDeleteTournamentPlayers()
					}, 100)
				})
			}
		}
	}

	hideAiConfig() {
		let config = document.getElementById("aiConfig");
		if (!config)
			return ;
		config.classList.add("hided")
		this.remove("aiConfig")
	}

	hideLocalGame() {
		let gameOverlay = document.getElementById("gameOverlay");
		if (!gameOverlay)
			return ;
		gameOverlay.classList.add("hided")
		this.remove("gameOverlay")
	}

	hideListTournaments() {
		let div = document.getElementById("listTournaments");
		if (!div)
			return ;
		div.classList.add("hided")
		this.remove("listTournaments")
	}

	getLocalGame(id) {
		this.getApiResponseJson("/api/game/get/", {id: id}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				if (res.winScore <= res.p1score || res.winScore <= res.p2score)
					this.setPong("bg")
				else
					this.setPong("p1Game");
				this.pong.game_id = id;
				this.pong.gameInfo = res;
				let homeContent = document.getElementById("homeContent");
				if (document.getElementById("gameOverlay"))
					return ;
				homeContent.innerHTML += res.html;
				let gameOverlay = document.getElementById("gameOverlay")
				if (gameOverlay.dataset.loaded != "true") {
					gameOverlay.dataset.loaded = "true";
					document.getElementById("p1score").innerHTML = res.p1score
					document.getElementById("p2score").innerHTML = res.p2score
					if (res.p1score >= res.winScore || res.p2score >= res.winScore) {
						let endDiv = document.getElementById("countdown");
						if (endDiv) {
							let p1 = "A.I.";
							if (res.p1.id != -1)
								p1 = res.p1.username;
							let p2 = res.p2Local;
							if (res.p2.id != -1)
								p2 = res.p2.username;
							let gameVs = "<span class='fs-2 text-light-emphasis'>" + p1 + " vs " + p2 + "</span>";
							if (res.p1score > res.p2score)
								endDiv.innerHTML = gameVs + "<p style='font-size:5rem; margin-top: -30px'>" + p1 + " wins this game !</p>"
							else
								endDiv.innerHTML = gameVs + "<p style='font-size:5rem; margin-top: -30px'>" + p2 + " wins this game !</p>"
							endDiv.classList.remove("coundown");
							endDiv.style.fontSize = "5rem"
							endDiv.classList.add("visible");
						}
						console.log('game is finished...')
					} else {
						this.pong.config = res;
					}
				}
			} else {
				history.replaceState("", "", "/");
				this.router();
			}
		});
	}

	getMultiGame(id) {
		this.getApiResponseJson("/api/game/get/", {id: id}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				if (res.winScore <= res.p1score || res.winScore <= res.p2score)
					this.setPong("bg")
				else
					this.setPong("p1Game");
				this.pong.game_id = id;
				this.pong.gameInfo = res;
				// set pong event handlers here
				this.pong.initEvents();
				this.pong.notConnected = true;
				let homeContent = document.getElementById("homeContent");
				if (document.getElementById("gameOverlay"))
					return ;
				homeContent.innerHTML += res.html;
				let gameOverlay = document.getElementById("gameOverlay")
				if (gameOverlay.dataset.loaded != "true") {
					gameOverlay.dataset.loaded = "true";
					document.getElementById("p1score").innerHTML = res.p1score
					document.getElementById("p2score").innerHTML = res.p2score
					if (res.p1score >= res.winScore || res.p2score >= res.winScore) {
						let endDiv = document.getElementById("countdown");
						if (endDiv) {
							let p1 = "A.I.";
							if (res.p1.id != -1)
								p1 = res.p1.username;
							let p2 = res.p2Local;
							if (res.p2.id != -1)
								p2 = res.p2.username;
							let gameVs = "<span class='fs-2 text-light-emphasis'>" + p1 + " vs " + p2 + "</span>";
							if (res.p1score > res.p2score)
								endDiv.innerHTML = gameVs + "<p style='font-size:5rem; margin-top: -30px'>" + p1 + " wins this game !</p>"
							else
								endDiv.innerHTML = gameVs + "<p style='font-size:5rem; margin-top: -30px'>" + p2 + " wins this game !</p>"
							endDiv.classList.remove("coundown");
							endDiv.style.fontSize = "5rem"
							endDiv.classList.add("visible");
						}
						console.log('game is finished...')
					} else {
						this.pong.config = res;
					}
				}
			} else {
				history.replaceState("", "", "/");
				this.router();
			}
		});
	}

	getLocalAiGame(id) {
		this.getApiResponseJson("/api/game/get/", {id: id}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				if (res.winScore <= res.p1score || res.winScore <= res.p2score)
					this.setPong("bg")
				else
					this.setPong("p1Game");
				this.pong.game_id = id;
				this.pong.gameInfo = res;
				let homeContent = document.getElementById("homeContent");
				if (document.getElementById("gameOverlay"))
					return ;
				homeContent.innerHTML += res.html;
				let gameOverlay = document.getElementById("gameOverlay")
				if (gameOverlay.dataset.loaded != "true") {
					gameOverlay.dataset.loaded = "true";
					document.getElementById("p1score").innerHTML = res.p1score
					document.getElementById("p2score").innerHTML = res.p2score
					if (res.p1score >= res.winScore || res.p2score >= res.winScore) {
						let endDiv = document.getElementById("countdown");
						if (endDiv) {
							let p1 = "A.I.";
							if (res.p1.id != -1)
								p1 = res.p1.username;
							let p2 = "A.I.";
							if (res.p2.id != -1)
								p2 = res.p2.username;
							let gameVs = "<span class='fs-2 text-light-emphasis'>" + p1 + " vs " + p2 + "</span>";
							if (res.p1score > res.p2score)
								endDiv.innerHTML = gameVs + "<p style='font-size:5rem; margin-top: -30px'>" + p1 + " wins this game !</p>"
							else
								endDiv.innerHTML = gameVs + "<p style='font-size:5rem; margin-top: -30px'>" + p2 + " wins this game !</p>"
							endDiv.classList.remove("coundown");
							endDiv.style.fontSize = "5rem"
							endDiv.classList.add("visible");
						}
						console.log('game is finished...')
					} else {
						this.pong.config = res;
					}
				}
			} else {
				history.replaceState("", "", "/");
				this.router();
			}
		});
	}

	getListTournaments(id) {
		if (id == -1 || id == undefined) {
			this.getApiResponse("api/view/listTournaments/").then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					let homeContent = document.getElementById("homeContent");
					homeContent.innerHTML += res.html;
				} else {
					history.replaceState("", "", "/");
					this.router();
				}
			});
		} else {
			let resultDiv = document.getElementById("resultTournament")
			resultDiv.innerHTML = "Consulting the blockchain..."
			this.getApiResponse("/api/view/getTournament/" + id).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					this.getApiResponseJson("/api/tournament/getWinner/", res).then((response) => {
						let result = JSON.parse(response);
						if (result.success) {
							if (resultDiv) {
								resultDiv.innerHTML = result.html
							}
						} else {
							resultDiv.innerHTML = result.html
						}
					});
				} else {
					history.replaceState("", "", "/");
					this.router();
				}
			});
		}
	}

	hideLocalConfigPage() {
		let configView = document.getElementById("aiConfig");
		if (!configView)
			return ;
		configView.classList.add("hided")
		this.remove("aiConfig")
	}

	getLocalAiConfigPage() {
		let homeContent = document.getElementById("homeContent");
		if (!homeContent)
			return ;
		this.getApiResponse("/api/view/localAiConfig/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				homeContent.innerHTML += res.html;
				setTimeout(() => {
					let configView = document.getElementById("aiConfig");
					if (!configView)
						return ;
					configView.classList.remove("hided");
					this.setAiConfigInteraction();
				}, 200);
			}
		});
	}

	setAiConfigInteraction() {
		let config = {
			winScore: 10,
			startSpeed: 8,
			bonuses: true,
			ai: 1,
			leftKey: 65,
			rightKey: 68,
		}
		let configView = document.getElementById("aiConfig");
		if (configView.dataset.events != "done") {
			configView.dataset.events = "done";
			let winScore = document.getElementById("winScore");
			let winScoreText = document.getElementById("winScoreText");
			winScore.addEventListener('input', (e) => {
				winScoreText.innerHTML = winScore.value;
				config.winScore = winScore.value;
			});
			let startSpeed = document.getElementById("startSpeed");
			let startSpeedText = document.getElementById("startSpeedText");
			startSpeed.addEventListener('input', (e) => {
				startSpeedText.innerHTML = startSpeed.value;
				config.startSpeed = startSpeed.value;
			});
			if (document.querySelector('input[name="bonuses"]')) {
				document.querySelectorAll('input[name="bonuses"]').forEach((elem) => {
					elem.addEventListener("change", function(event) {
						if (event.target.value == 'on')
							config.bonuses = true;
						else
							config.bonuses = false;
					});
				});
			}
			if (document.querySelector('input[name="aiLevel"]')) {
				document.querySelectorAll('input[name="aiLevel"]').forEach((elem) => {
					elem.addEventListener("change", function(event) {
						if (event.target.value == 'normal')
							config.ai = 1;
						else
							config.ai = 2;
					});
				});
			}
			let leftKey = document.getElementById("leftKey");
			leftKey.addEventListener("click", async (e) => {
				leftKey.innerHTML = "_";
				await this.waitKeypress("leftKey");
				config.leftKey = leftKey.dataset.code;
			})
			let rightKey = document.getElementById("rightKey");
			rightKey.addEventListener("click", async (e) => {
				rightKey.innerHTML = "_";
				await this.waitKeypress("rightKey");
				config.rightKey = rightKey.dataset.code;
			})
			let playBtn = document.getElementById("playBtn")
			playBtn.addEventListener("click", (e) => {
				this.getApiResponseJson("/api/game/new/1vsAI/", config).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
						let aiConfig = document.getElementById("aiConfig");
						aiConfig.classList.add("hided")
						this.remove("aiConfig")
						history.pushState("", "", "/play1vsAI/" + res.id);
						this.router();
					}
				});
			});
		}
	}

	getLocalConfigPage() {
		let homeContent = document.getElementById("homeContent");
		if (!homeContent)
			return ;
		this.getApiResponse("/api/view/localConfig/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				homeContent.innerHTML += res.html;
				setTimeout(() => {
					let configView = document.getElementById("config");
					if (!configView)
						return ;
					configView.classList.remove("hided");
					this.setConfigInteraction();
				}, 200);
			}
		});
	}

	getMultiConfigPage() {
		let homeContent = document.getElementById("homeContent");
		if (!homeContent)
			return ;
		this.getApiResponse("/api/view/multiConfig/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				homeContent.innerHTML += res.html;
				setTimeout(() => {
					let configView = document.getElementById("config");
					if (!configView)
						return ;
					configView.classList.remove("hided");
					this.setMultiConfigInteraction();
					//this.setTournamentConfigInteraction();
				}, 200);
			}
		});
	}

	setConfigInteraction() {
		let config = {
			winScore: 10,
			startSpeed: 8,
			bonuses: true,
			ai: 1,
			leftKey: 65,
			rightKey: 68,
			leftKey2: 37,
			rightKey2: 39,
			p2Local: '',
		}
		let configView = document.getElementById("config");
		if (configView.dataset.events != "done") {
			configView.dataset.events = "done";
			let winScore = document.getElementById("winScore");
			let winScoreText = document.getElementById("winScoreText");
			winScore.addEventListener('input', (e) => {
				winScoreText.innerHTML = winScore.value;
				config.winScore = winScore.value;
			});
			let startSpeed = document.getElementById("startSpeed");
			let startSpeedText = document.getElementById("startSpeedText");
			startSpeed.addEventListener('input', (e) => {
				startSpeedText.innerHTML = startSpeed.value;
				config.startSpeed = startSpeed.value;
			});
			if (document.querySelector('input[name="bonuses"]')) {
				document.querySelectorAll('input[name="bonuses"]').forEach((elem) => {
					elem.addEventListener("change", function(event) {
						if (event.target.value == 'on')
							config.bonuses = true;
						else
							config.bonuses = false;
					});
				});
			}
			let leftKey = document.getElementById("leftKey");
			leftKey.addEventListener("click", async (e) => {
				leftKey.innerHTML = "_";
				await this.waitKeypress("leftKey");
				config.leftKey = leftKey.dataset.code;
			})
			let rightKey = document.getElementById("rightKey");
			rightKey.addEventListener("click", async (e) => {
				rightKey.innerHTML = "_";
				await this.waitKeypress("rightKey");
				config.rightKey = rightKey.dataset.code;
			})
			if (document.querySelector('input[name="p2Local"]')) {
				document.querySelector('input[name="p2Local"]').addEventListener("input", function(e) {
					config.p2Local = e.target.value;
				});
			}
			let leftKey2 = document.getElementById("leftKey2");
			leftKey2.addEventListener("click", async (e) => {
				leftKey2.innerHTML = "_";
				await this.waitKeypress("leftKey2");
				config.leftKey2 = leftKey2.dataset.code;
			})
			let rightKey2 = document.getElementById("rightKey2");
			rightKey2.addEventListener("click", async (e) => {
				rightKey2.innerHTML = "_";
				await this.waitKeypress("rightKey2");
				config.rightKey2 = rightKey2.dataset.code;
			})
			let playBtn = document.getElementById("playBtn")
			playBtn.addEventListener("click", (e) => {
				if (config.p2Local == "")
					config.p2Local = "Local P2"
				this.getApiResponseJson("/api/game/new/1vs1/", config).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
						let config = document.getElementById("config");
						config.classList.add("hided")
						this.remove("config")
						history.pushState("", "", "/play1vs1/" + res.id);
						this.router();
					}
				});
			});
		}
	}

	setMultiConfigInteraction() {
		let config = {
			winScore: 10,
			startSpeed: 8,
			bonuses: true,
			ai: 1,
			leftKey: 65,
			rightKey: 68,
			leftKey2: 37, // disable local p2 controls
			rightKey2: 39, // disable local p2 controls
			p2Local: '',
		}
		this.playerMulti = 0;
		let configView = document.getElementById("config");
		if (configView.dataset.events != "done") {
			configView.dataset.events = "done";
			let winScore = document.getElementById("winScore");
			let winScoreText = document.getElementById("winScoreText");
			winScore.addEventListener('input', (e) => {
				winScoreText.innerHTML = winScore.value;
				config.winScore = winScore.value;
			});
			let startSpeed = document.getElementById("startSpeed");
			let startSpeedText = document.getElementById("startSpeedText");
			startSpeed.addEventListener('input', (e) => {
				startSpeedText.innerHTML = startSpeed.value;
				config.startSpeed = startSpeed.value;
			});
			if (document.querySelector('input[name="bonuses"]')) {
				document.querySelectorAll('input[name="bonuses"]').forEach((elem) => {
					elem.addEventListener("change", function(event) {
						if (event.target.value == 'on')
							config.bonuses = true;
						else
							config.bonuses = false;
					});
				});
			}
			document.getElementById("addPlayer").addEventListener("keyup", (e) => {
				let val = document.getElementById("addPlayer").value;
				if (val != "")
					this.searchPlayerMulti(val);
				else {
					let playerResult = document.getElementById("playerResult");
					if (playerResult)
						playerResult.innerHTML = "";
				}
			})

			let playBtn = document.getElementById("playBtn")
			playBtn.addEventListener("click", (e) => {
				this.getApiResponseJson("/api/game/new/multi_chat/", {config: config, p2: this.playerMulti.id}).then((response) => {
					let res = JSON.parse(response);
					if (res.success) {
						this.chatSocket.send(JSON.stringify({
							'gameNotif': res.g1,
							'p1': res.p1,
							'p2': res.p2,
						}));
						let config = document.getElementById("config");
						config.classList.add("hided")
						this.remove("config")
						history.pushState("", "", "/multi/" + res.g1);
						this.router();
					}
				});
			});
		}
	}

	waitKeypress(id) {
		return new Promise((resolve) => {
			let btn = document.getElementById(id);
			document.addEventListener('keydown', onKeyHandler);
			function onKeyHandler(e) {
				if ((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 37 && e.keyCode <= 40)) {
					if (e.keyCode >= 65)
						btn.innerHTML = String.fromCharCode(e.keyCode);
					else if (e.keyCode == 37)
						btn.innerHTML = "←";
					else if (e.keyCode == 38)
						btn.innerHTML = "↑";
					else if (e.keyCode == 39)
						btn.innerHTML = "→";
					else if (e.keyCode == 40)
						btn.innerHTML = "↓";
					btn.dataset.code = e.keyCode;
					document.removeEventListener('keydown', onKeyHandler);
					resolve();
				}
			}
		});
	}

	getCreateGame() {
		let homeContent = document.getElementById("homeContent");
		if (!homeContent)
			return ;
		this.getApiResponse("/api/view/createGame/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				homeContent.innerHTML = res.html;
				let gameBtns = document.getElementById("createGame");
				setTimeout(() => {
					let dom = document.getElementById("createGame")
					if (dom)
						dom.classList.remove("hided");
				}, 15);
			}
		});
	}

	initHideMenusOnBgClick() {
		let menuBack = document.getElementById("menuBack");
		if (!menuBack)
			return ;
		menuBack.addEventListener("click", (e) => {
			let menu = document.getElementById("menu");
			if (!menu.classList.contains("hided")) {
				let userBtn = document.getElementsByClassName("user")
				for (let i = 0; i < userBtn.length; i++)
					userBtn[i].classList.remove("selected");
			}
			menu.classList.add("hided");
			menu.style.pointerEvents = "none";
			let addFriendMenu = document.getElementById("addFriendMenu");
			if (!addFriendMenu.classList.contains("hided")) {
				let friendBtn = document.getElementById("addFriend")
				friendBtn.classList.remove("selected");
				document.getElementById("addFriendInput").value = ""
				document.getElementById("searchResult").innerHTML = ""
			}
			addFriendMenu.classList.add("hided");
			addFriendMenu.style.pointerEvents = "none";
			let chatMenu = document.getElementById("chatMenu");
			chatMenu.classList.add("hided");
			chatMenu.style.pointerEvents = "none";
			menuBack.classList.add("hided");
			menuBack.classList.add("pe-none");
		});
	}

	updateRooms() {
		let chatRooms = document.getElementById("chatRooms");
		if (!chatRooms)
			return ;
		this.getApiResponse("/api/view/chatRoomsView/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				if (chatRooms) {
					chatRooms.innerHTML = res.html;
					this.initChatDocker();
				}
			}
		});
	}

	initChatDocker() {
		let chat = document.getElementById("chatContainer");
		let visibleChat = document.getElementById("chatContainer").firstChild;
		let vChat = 0
		if (visibleChat && visibleChat.dataset)
			vChat = visibleChat.dataset.room
		let chatDocker = document.getElementById("chatDocker")
		if (!chatDocker)
			return ;
		let roomsDom = document.getElementsByClassName("room");
		let isThere = false;
		for (let i = 0; i < roomsDom.length; i++) {
			if (roomsDom[i].dataset.room == vChat) {
				isThere = true;
				roomsDom[i].classList.add("selected");
			}
			roomsDom[i].addEventListener("click", (e) => {
				let target = e.target;
				target.getElementsByClassName("newMess")[0].classList.add("hided")
				// here i need to update all messages from the other user to read=True.
				if (target.dataset.room != "Public") {
					this.getApiResponseJson("/api/messages/setRead/", {room: target.dataset.room, user: target.dataset.user}).then((response) => {
						let res = JSON.parse(response);
					});
				}
				let chatRooms = chat.getElementsByClassName("chatRoom")
				for (let j = 0; j < roomsDom.length; j++) {
					if (roomsDom[j] != target && roomsDom[j].classList.contains("selected")) {
						roomsDom[j].classList.remove("selected");
						for (let k = 0; k < chatRooms.length; k++)
							if (chatRooms[k].dataset.room == roomsDom[j].dataset.room)
								chatRooms[k].remove();
					}
				}
				target.classList.toggle("selected");
				if (target.classList.contains("selected")) {
					this.displayChat(target.dataset.room)
				} else {
					let chatRooms = chat.getElementsByClassName("chatRoom")
					for (let j = 0; j < chatRooms.length; j++) {
						if (chatRooms[j].dataset.room == target.dataset.room)
							chatRooms[j].remove();
					}
				}
			})
		}
		if (!isThere && visibleChat) {
			visibleChat.remove();
		}
	}

	displayChat(roomId) { // do the same for new messages please
		this.getApiResponseJson("/api/view/chatView/", {room: roomId}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let chatContainer = document.getElementById("chatContainer")
				if (!chatContainer)
					return ;
				chatContainer.innerHTML = res.html;
				let messages = chatContainer.getElementsByClassName("message__avatar")
				for (let i = 0; i < messages.length; i++) {
					if (messages[i].dataset.user == this.user.id)
						continue ;
					messages[i].addEventListener("click", (e) => {
						this.getApiResponseJson("/api/view/chatMenu/", {id: e.target.dataset.user}).then((response) => {
							let res = JSON.parse(response);
							if (res.success) {
								let chatMenu = document.getElementById("chatMenu")
								if (!chatMenu)
									return ;
								chatMenu.style.top = (e.clientY + 5) + "px";
								chatMenu.style.right = (window.innerWidth - e.clientX + 5) + "px";
								chatMenu.innerHTML = res.html;
								this.chatMenuSendPlay();
								this.chatMenuDeleteFriend();
								this.chatMenuAddFriend();
								this.chatMenuViewProfile();
								this.chatMenuBlockUser();
								let menuBack = document.getElementById("menuBack")
								menuBack.classList.remove("pe-none");
								chatMenu.classList.remove("displayNone");
								chatMenu.style.pointerEvents = "all";
								setTimeout(() => {
									chatMenu.classList.remove("hided");
								}, 15)
							}
						});
					})
				}
				let chatBottom = document.getElementById("chatBottom")
				if (chatBottom)
					chatBottom.scrollIntoView()
				if (document.getElementById('chatSend')) {
					document.getElementById('chatSend').addEventListener("click", sendMessage.bind(this), false);
					document.getElementById('chatMessage').addEventListener("keyup", sendMessage.bind(this), false);
					function sendMessage(e) {
						if (e.target.id == "chatMessage" && e.which != 13)
							return ;
						e.preventDefault();
						const message = document.getElementById('chatMessage').value;
						if (message == "")
							return ;
						if (this.chatSocket.readyState === WebSocket.OPEN) {
							this.chatSocket.send(JSON.stringify({
								'message': message,
								'room': roomId
							}));
							document.getElementById('chatMessage').value = '';
						} else {
							console.error('Chat socket is not open. Unable to send message.');
						}
					}
				}
			}
		})
	}

	chatMenuViewProfile() {
		let viewProfile = document.getElementById("chatViewProfile")
		if (!viewProfile)
			return ;
		viewProfile.addEventListener("click", (e) => {
			let menu = document.getElementById("chatMenu");
			if (!menu)
				return ;
			menu.classList.add("hided");
			menu.style.pointerEvents = ("none");
			this.displayNone("chatMenu")
			let menuBack = document.getElementById("menuBack");
			menuBack.classList.add("hided");
			menuBack.classList.add("pe-none");
			history.pushState("", "", "/profile/" + e.target.dataset.id);
			this.router();
		});
	}

	chatMenuBlockUser() {
		let blockUser = document.getElementById("chatBlockUser")
		if (!blockUser)
			return ;
		blockUser.addEventListener("click", (e) => {
			this.getApiResponseJson("/api/user/block/", {id: e.target.dataset.id}).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					let chat = document.getElementById("chatContainer").firstChild;
					if (chat && chat.dataset.user == e.target.dataset.id)
						chat.remove();
					else if (chat && chat.dataset.room == "Public")
						this.displayChat("Public");
					this.chatSocket.send(JSON.stringify({
						'updateFriends': true
					}));
					let menu = document.getElementById("chatMenu");
					if (!menu)
						return ;
					menu.classList.add("hided");
					menu.style.pointerEvents = ("none");
					this.displayNone("chatMenu")
					let menuBack = document.getElementById("menuBack");
					menuBack.classList.add("hided");
					menuBack.classList.add("pe-none");
				}
			});
		});
	}

	chatMenuAddFriend() {
		let addFriend = document.getElementById("chatAddFriend");
		if (!addFriend)
			return ;
		addFriend.addEventListener("click", (e) => {
			this.getApiResponseJson("/api/user/addfriend/", {id: e.target.dataset.id}).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					this.chatSocket.send(JSON.stringify({
						'friendRequest': e.target.dataset.id
					}));
					let menu = document.getElementById("chatMenu");
					if (!menu)
						return ;
					menu.classList.add("hided");
					menu.style.pointerEvents = ("none");
					this.displayNone("chatMenu")
					let menuBack = document.getElementById("menuBack");
					menuBack.classList.add("hided");
					menuBack.classList.add("pe-none");
				}
			});
		});
	}

	chatMenuDeleteFriend() {
		let deleteFriend = document.getElementById("chatDeleteFriend")
		if (!deleteFriend)
			return ;
		deleteFriend.addEventListener("click", (e) => {
			this.getApiResponseJson("/api/user/deletefriend/", {id: e.target.dataset.id}).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					this.updateConnectedUsers()
					this.updateRooms()
					let menu = document.getElementById("chatMenu");
					if (!menu)
						return ;
					menu.classList.add("hided");
					menu.style.pointerEvents = ("none");
					this.displayNone("chatMenu")
					let menuBack = document.getElementById("menuBack");
					menuBack.classList.add("hided");
					menuBack.classList.add("pe-none");
					let chat = document.getElementById("chatContainer").firstChild;
					if (chat.dataset.user == e.target.dataset.id)
						chat.remove();
					this.chatSocket.send(JSON.stringify({
						'updateFriends': true
					}));
				}
			});
		})
	}

	initAddFriendBtn() {
		let addFriend = document.getElementById("addFriend");
		if (!addFriend)
			return ;
		document.getElementById("addFriendInput").addEventListener("keyup", (e) => {
			let val = document.getElementById("addFriendInput").value;
			if (val != "")
				this.searchUser(val);
			else {
				let searchResult = document.getElementById("searchResult");
				if (searchResult)
					searchResult.innerHTML = "";
			}
		})
		addFriend.addEventListener("click", (e) => {
			let menu = document.getElementById("addFriendMenu");
			if (menu) {
				menu.style.top = (e.clientY + 5) + "px";
				menu.style.right = (window.innerWidth - e.clientX + 5) + "px";
			}
			let target = e.target;
			target.classList.toggle("selected");
			let menuBack = document.getElementById("menuBack")
			menuBack.classList.remove("pe-none");
			menu.classList.remove("displayNone");
			menu.style.pointerEvents = "all";
			setTimeout(() => {
				menu.classList.remove("hided");
				document.getElementById("addFriendInput").focus();
			}, 15)
		})
	}

	initViewProfileBtn() {
		let profile = document.getElementById("displayProfilBtn");
		if (!profile)
			return ;
		profile.addEventListener("click", (e) => {
			let menu = document.getElementById("menu");
			if (!menu)
				return ;
			menu.classList.add("hided");
			menu.style.pointerEvents = ("none");
			this.displayNone("menu")
			let menuBack = document.getElementById("menuBack");
			menuBack.classList.add("hided");
			menuBack.classList.add("pe-none");
			history.pushState("", "", "/profile/" + e.target.dataset.id);
			this.router();
		});
	}

	initDeleteFriendBtn() {
		let delFriend = document.getElementById("deleteFriend");
		if (!delFriend)
			return ;
		delFriend.addEventListener("click", (e) => {
			this.getApiResponseJson("/api/user/deletefriend/", {id: e.target.dataset.id}).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					this.updateConnectedUsers()
					this.updateRooms()
					let menu = document.getElementById("menu");
					if (!menu)
						return ;
					menu.classList.add("hided");
					menu.style.pointerEvents = ("none");
					this.displayNone("menu")
					let menuBack = document.getElementById("menuBack");
					menuBack.classList.add("hided");
					menuBack.classList.add("pe-none");
					let chat = document.getElementById("chatContainer").firstChild;
					if (chat.dataset.user == e.target.dataset.id)
						chat.remove();
					this.chatSocket.send(JSON.stringify({
						'updateFriends': true
					}));
				}
			});
		})
	}

	handleNewMessage(data) {
		let roomsBtn = document.getElementsByClassName("room");
		for (let i = 0; i < roomsBtn.length; i++) {
			if (roomsBtn[i].dataset.room == data.roomId) {
				if (!roomsBtn[i].classList.contains("selected"))
					roomsBtn[i].getElementsByClassName("newMess")[0].classList.remove("hided");
			}
		}
		let visibleRoom = document.getElementsByClassName("chatRoom")[0];
		if (!visibleRoom || visibleRoom.dataset.room != data.roomId)
			return ;
		this.getApiResponseJson("/api/view/chatMessageView/", {message: data.message, user:data.user, timestamp: data.timestamp}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let div = document.createElement('div');
				div.innerHTML = res.html;
					let chatBottom = document.getElementById("chatBottom");
				if (chatBottom) {
					let parent = chatBottom.parentNode;
					parent.insertBefore(div, chatBottom);
					let messages = parent.getElementsByClassName("message")
					setTimeout(() => {
						messages[messages.length - 1].classList.remove("hided");
						messages[messages.length - 1].classList.remove("height0");
						let avatar = messages[messages.length - 1].querySelector(".message__avatar");
						let i = messages.length - 1;
						if (avatar) {
							if (messages[i].dataset.user == this.user.id)
								return ;
							messages[i].addEventListener("click", (e) => {
								this.getApiResponseJson("/api/view/chatMenu/", {id: e.target.dataset.user}).then((response) => {
									let res = JSON.parse(response);
									if (res.success) {
										let chatMenu = document.getElementById("chatMenu")
										if (!chatMenu)
											return ;
										chatMenu.style.top = (e.clientY + 5) + "px";
										chatMenu.style.right = (window.innerWidth - e.clientX + 5) + "px";
										chatMenu.innerHTML = res.html;
										this.chatMenuSendPlay();
										this.chatMenuDeleteFriend();
										this.chatMenuAddFriend();
										this.chatMenuBlockUser();
										let menuBack = document.getElementById("menuBack")
										menuBack.classList.remove("pe-none");
										chatMenu.classList.remove("displayNone");
										chatMenu.style.pointerEvents = "all";
										setTimeout(() => {
											chatMenu.classList.remove("hided");
										}, 15)
									}
								});
							})
						}
						chatBottom.scrollIntoView()
					}, 15);
				}
			}
		});
	}

	chatMenuSendPlay() {
		let config = {
			winScore: 10,
			startSpeed: 8,
			bonuses: true,
			ai: 1,
			leftKey: 65,
			rightKey: 68,
			leftKey2: 37, // disable local p2 controls
			rightKey2: 39, // disable local p2 controls
		}
		let sendPlay = document.getElementById("chatSendPlay");
		if (!sendPlay)
			return ;
		sendPlay.addEventListener("click", (e) => {
			this.getApiResponseJson("/api/game/new/multi_chat/", {config: config, p2: e.target.dataset.id}).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					this.chatSocket.send(JSON.stringify({
						'gameNotif': res.g1,
						'p1': res.p1,
						'p2': res.p2,
					}));
					history.pushState("", "", "/multi/" + res.g1);
					this.router();
				}
			});
		});

/*
			this.getApiResponseJson("/api/user/addfriend/", {id: e.target.dataset.id}).then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					this.chatSocket.send(JSON.stringify({
						'friendRequest': e.target.dataset.id
					}));
					let menu = document.getElementById("chatMenu");
					if (!menu)
						return ;
					menu.classList.add("hided");
					menu.style.pointerEvents = ("none");
					this.displayNone("chatMenu")
					let menuBack = document.getElementById("menuBack");
					menuBack.classList.add("hided");
					menuBack.classList.add("pe-none");
				}
			});
		});
*/
	}

	handleTournamentNotif(data) {
		if (!(this.user.id == data.p1 || this.user.id == data.p2))
			return ;
		this.getApiResponseJson("/api/view/gameRequestView/", {id: data.game_notif}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let notificationCenter = document.getElementById("notif")
				if (notificationCenter) {
					notificationCenter.innerHTML += res.html;
					this.addNotificationEvents();
				}
			}
		});
	}

	handleFriendRequestMessage(data) {
		if (this.user.id != data.friendRequest)
			return ;
		this.getApiResponseJson("/api/view/friendRequestView/", {from: data.from}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let notificationCenter = document.getElementById("notif")
				if (notificationCenter) {
					notificationCenter.innerHTML += res.html;
					this.addNotificationEvents();
				}
			}
		});
	}

	addNotificationEvents() {
		let notificationCenter = document.getElementById("notif")
		if (!notificationCenter)
			return ;
		let notif = notificationCenter.getElementsByClassName("notification")
		for (let i=0; i < notif.length; i++) {
			if (notif[i].classList.contains("hided")) {
				if (notif[i].dataset
					&& parseInt(notif[i].dataset.gametype) == 0
					&& this.path == "/play1vsAI"
					&& notif[i].dataset.game
					&& parseInt(notif[i].dataset.game) == this.id) {
					notif[i].remove();
					continue;
				}
				if (notif[i].dataset
					&& parseInt(notif[i].dataset.gametype) == 1
					&& this.path == "/play1vs1"
					&& notif[i].dataset.game
					&& parseInt(notif[i].dataset.game) == this.id) {
					notif[i].remove();
					continue;
				}
				if (notif[i].dataset
					&& parseInt(notif[i].dataset.gametype) == 2
					&& this.path == "/multi"
					&& notif[i].dataset.game
					&& parseInt(notif[i].dataset.game) == this.id) {
					notif[i].remove();
					continue;
				}
				setTimeout(() => {
					notif[i].classList.remove("hided")
				}, 15)
				let acceptBtn = notif[i].childNodes[1].childNodes[1];
				if (acceptBtn.classList.contains("accept"))
					acceptBtn.addEventListener("click", this.acceptFriendRequest.bind(this), false);
				else if (acceptBtn.classList.contains("join"))
					acceptBtn.addEventListener("click", this.joinUnfinishedGame.bind(this), false);
				let deleteBtn = notif[i].childNodes[1].childNodes[2];
				if (deleteBtn.classList.contains("delete"))
					deleteBtn.addEventListener("click", this.deleteFriendRequest.bind(this), false);
				else if (deleteBtn.classList.contains("forfeit"))
					deleteBtn.addEventListener("click", this.forfeitUnfinishedGame.bind(this), false);
			} else {
				if (notif[i].dataset
					&& parseInt(notif[i].dataset.gametype) == 0
					&& this.path == "/play1vsAI"
					&& notif[i].dataset.game
					&& parseInt(notif[i].dataset.game) == this.id) {
					notif[i].remove();
					continue;
				}
				if (notif[i].dataset
					&& parseInt(notif[i].dataset.gametype) == 1
					&& this.path == "/play1vs1"
					&& notif[i].dataset.game
					&& parseInt(notif[i].dataset.game) == this.id) {
					notif[i].remove();
					continue;
				}
				if (notif[i].dataset
					&& parseInt(notif[i].dataset.gametype) == 2
					&& this.path == "/multi"
					&& notif[i].dataset.game
					&& parseInt(notif[i].dataset.game) == this.id) {
					notif[i].remove();
					continue;
				}
			}
		}
	}

	joinUnfinishedGame(e) {
		let gameType = e.target.dataset.type;
		let gameId = e.target.dataset.game;
		if (gameType == 0) // Local 1 vs AI
			history.pushState("", "", "/play1vsAI/" + gameId);
		else if (gameType == 1) // Local 1 vs 1
			history.pushState("", "", "/play1vs1/" + gameId);
		else if (gameType == 2) // Remote 1 vs 1
			history.pushState("", "", "/multi/" + gameId);
		let notif = e.target.parentNode.parentNode;
		notif.classList.add("hided");
		setTimeout(() => {
			notif.remove();
		}, 200)
		this.router();
	}

	forfeitUnfinishedGame(e) {
		let gameId = e.target.dataset.game;
		this.getApiResponseJson("/api/game/forfeit/", {id: gameId}).then((response) => {
			let res = JSON.parse(response)
			if (res.success) {
				let notif = e.target.parentNode.parentNode;
				notif.classList.add("hided");
				setTimeout(() => {
					notif.remove();
				}, 200)
			}
		})
	}

	acceptFriendRequest(e) {
		this.getApiResponseJson("/api/user/acceptfriend/", {id: e.target.dataset.from}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				this.chatSocket.send(JSON.stringify({
					'updateFriends': true
				}));
				let notif = e.target.parentNode.parentNode;
				notif.classList.add("hided");
				setTimeout(() => {
					notif.remove();
				}, 200)
			}
		})
	}

	deleteFriendRequest(e) {
		this.getApiResponseJson("/api/user/deleterequest/", {from: e.target.dataset.from}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let notif = e.target.parentNode.parentNode;
				notif.classList.add("hided");
				setTimeout(() => {
					notif.remove();
				}, 200)
			}
		})
	}

	searchUser(val) {
		this.getApiResponseJson("/api/user/search/", {search: val}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let searchResult = document.getElementById("searchResult");
				if (searchResult)
					searchResult.innerHTML = res.html;
				let btns = searchResult.getElementsByClassName("btn");
				for (let i = 0; i < btns.length; i++) {
					btns[i].addEventListener("click", (e) => {
						if (e.target.dataset.type == "send") {
							this.getApiResponseJson("/api/user/addfriend/", {id: btns[i].dataset.id}).then((response) => {
								let res = JSON.parse(response);
								if (res.success) {
									let val = document.getElementById("addFriendInput").value;
									if (val != "")
										this.searchUser(val);
									this.chatSocket.send(JSON.stringify({
										'friendRequest': btns[i].dataset.id
									}));
								}
							});
						} else if (e.target.dataset.type == "unblock") {
							this.getApiResponseJson("/api/user/unblock/", {id: btns[i].dataset.id}).then((response) => {
								let res = JSON.parse(response);
								if (res.success) {
									this.searchUser(val);
									let chat = document.getElementById("chatContainer").firstChild;
									if (chat && chat.dataset.room == "Public")
										this.displayChat("Public");
								}
							});
						} else {
							this.getApiResponseJson("/api/user/acceptfriend/", {id: btns[i].dataset.id}).then((response) => {
								let res = JSON.parse(response);
								if (res.success) {
									this.updateConnectedUsers()
									let val = document.getElementById("addFriendInput").value;
									if (val != "")
										this.searchUser(val);
								}
							})
						}
					})
				}
			}
		});
	}

	updateConnectedUsers() {
		let connectedUsers = document.getElementById("chatConnectedUsers");
		if (!connectedUsers)
			return ;
		this.getApiResponse("/api/view/chatUserView/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				if (connectedUsers) {
					connectedUsers.innerHTML = res.html;
				}
				let usersDom = document.getElementsByClassName("user");
				for (let i = 0; i < usersDom.length; i++) {
					usersDom[i].addEventListener("click", (e) => {
						let menu = document.getElementById("menu");
						if (menu) {
							menu.style.top = (e.clientY + 5) + "px";
							menu.style.right = (window.innerWidth - e.clientX + 5) + "px";
						}
						let target = e.target;
						for (let j = 0; j < usersDom.length; j++) {
							if (usersDom[j] != target)
								usersDom[j].classList.remove("selected");
						}
						target.classList.toggle("selected");
						let menuBack = document.getElementById("menuBack")
						menuBack.classList.remove("pe-none");
						menu.classList.remove("displayNone");
						menu.style.pointerEvents = "all";
						setTimeout(() => {
							menu.classList.remove("hided");
						}, 15)
						let delFriendBtn = document.getElementById("deleteFriend");
						delFriendBtn.dataset.id = e.target.dataset.id
						let displayProfilBtn = document.getElementById("displayProfilBtn");
						displayProfilBtn.dataset.id = e.target.dataset.id
					})
				}
			}
		});
	}

	hideCreateGame() {
		let createGame = document.getElementById("createGame");
		if (createGame) {
			createGame.classList.add("hided");
			this.remove("createGame")
		}
	}

	hideLoginForm() {
		let loginForm = document.getElementById("loginForm");
		if (loginForm) {
			loginForm.classList.add("hided");
			loginForm.classList.add("trXp100");
			this.remove("loginForm")
		}
	}

	getLoginForm() {
		this.getApiResponse("/api/view/login/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let topContent = document.getElementById("topContent");
				topContent.innerHTML = res.html;
				let loginForm = document.getElementById("loginForm");
				loginForm.classList.add("trXm100");
				let form = document.getElementById("loginFormForm");
				let formBtn = document.getElementById("loginFormSubmitBtn");
				this.addTogglePasswordButtons();
				if (formBtn) {
					document.getElementById("loginFormSubmitBtn").addEventListener("click", e => {
						e.preventDefault();
						let formData = new FormData(form);
						this.getApiResponse("/api/user/signin/", formData).then((response) => {
							let res = JSON.parse(response);
							if (res.success) {
								history.pushState("", "", "/");
								this.router();
								this.updateUser();
							} else {
								loginForm.classList.add("shake");
								loginFormPassword.value = "";
								let loginFormAlert = document.getElementById("loginFormAlert");
								loginFormAlert.classList.remove("hided");
								setTimeout(() => {
									loginForm.classList.remove("shake");
								}, 500);
								setTimeout(() => {
									loginFormAlert.classList.add("hided");
								}, 500);
							}
						})
					})
				};
				setTimeout(() => {
					loginForm.classList.remove("hided");
					loginForm.classList.remove("trXm100");
				}, 15);
			}
		})
	}

	hideRegisterForm() {
		let registerForm = document.getElementById("registerForm");
		if (registerForm) {
			registerForm.classList.add("hided");
			registerForm.classList.add("trXp100");
			this.remove("registerForm");
		}
	}

	getRegisterForm() {
		this.getApiResponse("/api/view/register/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				this.updateTopContent(res.html);
				this.showRegisterForm();
				this.addRegisterFormSubmitListener();
				this.addTogglePasswordButtons();
				this.addProfilePictureChangeListener();
			}
		});
	}

	updateTopContent(html) {
		let topContent = document.getElementById("topContent");
		topContent.innerHTML = html;
	}

	showRegisterForm() {
		let registerForm = document.getElementById("registerForm");
		registerForm.classList.add("trXm100");
		setTimeout(() => {
			registerForm.classList.remove("hided");
			registerForm.classList.remove("trXm100");
		}, 15);
	}

	addRegisterFormSubmitListener() {
		let form = document.getElementById("registerFormForm");
		let formBtn = document.getElementById("registerFormSubmitBtn");
		if (formBtn) {
			formBtn.addEventListener("click", (e) => {
				e.preventDefault();
				let formData = new FormData(form);
				this.getApiResponse("api/user/register/", formData).then((response) => {
					let res = JSON.parse(response);
					if (res.success) {
						history.pushState("", "", "/");
						this.router();
						this.updateUser();
					} else {
						let registerForm = document.getElementById("registerForm");
						registerForm.classList.add("shake");
						document.getElementById("registerFormPassword").value = "";
						document.getElementById("registerFormPasswordConfirm").value = "";
						let registerFormAlert = document.getElementById("registerFormAlert");
						registerFormAlert.textContent = res.message;
						registerFormAlert.classList.remove("hided");
						setTimeout(() => {
							registerForm.classList.remove("shake");
						}, 500);
						setTimeout(() => {
							registerFormAlert.classList.add("hided");
						}, 5000);
					}
				});
			});
		}
	}

	addTogglePasswordButtons() {
		const togglePasswordButtons = document.querySelectorAll('.toggle-password');
		togglePasswordButtons.forEach((button) => {
			button.addEventListener('click', function () {
				const passwordField = this.previousElementSibling;
				const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
				passwordField.setAttribute('type', type);
				const icon = this.querySelector('i');
				icon.classList.toggle('bi-eye-slash');
				icon.classList.toggle('bi-eye');
			});
		});
	}

	addProfilePictureChangeListener() {
		let profilePictureInput = document.getElementById("registerFormProfilePicture");
		let previewProfilePicture = document.getElementById("previewProfilePicture");
		let registerFormAlert = document.getElementById("registerFormAlert");

		profilePictureInput.addEventListener("change", function () {
			if (this.files && this.files[0]) {
				let file = this.files[0];

				// Reset alert and preview
				registerFormAlert.classList.add('hided');
				registerFormAlert.textContent = '';
				previewProfilePicture.innerHTML = '';

				// File validation
				const fileSizeLimit = 1 * 1024 * 1024; // 1MB
				const allowedFileTypes = ['image/jpeg', 'image/png'];

				if (!allowedFileTypes.includes(file.type)) {
					registerFormAlert.textContent = 'Unsupported file type. Please upload an image file (JPEG, PNG).';
					registerFormAlert.classList.remove('hided');
					return;
				}

				if (file.size > fileSizeLimit) {
					registerFormAlert.textContent = 'File size exceeds 1MB. Please upload a smaller image.';
					registerFormAlert.classList.remove('hided');
					return;
				}

				let reader = new FileReader();
				reader.onload = function (e) {
					previewProfilePicture.innerHTML = `<img src="${e.target.result}" class="img-fluid rounded rounded-circle border border-white" style="width: 150px; height: 150px;">`;
				};
				reader.readAsDataURL(file);
			}
		});
	}



	hideProfile() {
		let profileView = document.getElementById("profile");
		if (!profileView)
			return ;
		profileView.classList.add("hided")
		this.remove("profile")
	}

	getProfile(id) {
		let homeContent = document.getElementById("homeContent");
		if (!homeContent) return;

		this.getApiResponse("/api/view/profile/" + id).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				homeContent.innerHTML = res.html;
				let profileView = document.getElementById("profile");
				if (!profileView) return;
				setTimeout(() => {
					profileView.classList.remove("hided");
				}, 15);

				this.addProfileFormSubmitListener(id);
				this.addProfilePictureChangeListener();
				this.addTogglePasswordButtons();
			}
		});
	}

	addProfileFormSubmitListener(id) {
		let form = document.getElementById("profileFormForm");
		let formEditBtn = document.getElementById("editProfileBtn");
		if (formEditBtn) {
			formEditBtn.addEventListener("click", (e) => {
				e.preventDefault();
				let notEdit = document.getElementsByClassName("notEdit");
				let toHide = document.getElementsByClassName("tohide");
				for (let i in notEdit) {
					if (notEdit[i].classList)
						notEdit[i].classList.add("d-none")
				}
				for (let i in toHide) {
					if (toHide[i].classList)
						toHide[i].classList.remove("d-none")
				}
				console.log(notEdit)
			});
		}
		let formBtn = document.getElementById("profileFormSubmitBtn");
		if (formBtn) {
			formBtn.addEventListener("click", (e) => {
				e.preventDefault();
				let formData = new FormData(form);
				this.getApiResponse("/api/user/profile/", formData).then((response) => {
					let res = JSON.parse(response);
					if (res.success) {
						this.getProfile(this.user.id);
					} else {
						let profileForm = document.getElementById("profile");
						let profileFormAlert = document.getElementById("profileFormAlert");
						profileFormAlert.textContent = res.message;
						profileFormAlert.classList.remove("hided");
						setTimeout(() => {
							profileFormAlert.classList.add("hided");
						}, 5000);
					}
				});
			});
		}
	}

	addProfilePictureChangeListener() {
		let previewProfilePicture = document.getElementById("previewProfilePicture");
		if (!previewProfilePicture)
			return ;
		let profileFormAlert = document.getElementById("profileFormAlert");

		previewProfilePicture.addEventListener("change", function () {
			if (this.files && this.files[0]) {
				let file = this.files[0];

				// Reset alert and preview
				profileFormAlert.classList.add('hided');
				profileFormAlert.textContent = '';
				previewProfilePicture.innerHTML = '';

				// File validation
				const fileSizeLimit = 1 * 1024 * 1024; // 1MB
				const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];

				if (!allowedFileTypes.includes(file.type)) {
					profileFormAlert.textContent = 'Unsupported file type. Please upload an image file (JPEG, PNG, GIF).';
					profileFormAlert.classList.remove('hided');
					return;
				}

				if (file.size > fileSizeLimit) {
					profileFormAlert.textContent = 'File size exceeds 1MB. Please upload a smaller image.';
					profileFormAlert.classList.remove('hided');
					return;
				}

				let reader = new FileReader();
				reader.onload = function (e) {
					previewProfilePicture.style.backgroundImage = `url(${e.target.result})`;
				};
				reader.readAsDataURL(file);
			}
		});
	}

	//-------------------------------------------------------
	// --------------------- SINGLETON ----------------------
	//-------------------------------------------------------

	static get() {
		if (!this.instance) {
			this.instance = new App();
		}
		return (this.instance);
	}
};

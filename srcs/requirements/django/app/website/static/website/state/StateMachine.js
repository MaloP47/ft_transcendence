// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   StateMachine.js                                    :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/06/13 11:54:22 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/17 12:11:36 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

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

	router(back) {
		let path = String(location.pathname)
		let id = -1
		if (path.indexOf("/play1vsAI/") == 0) {
			id = path.substring(11)
			path = "/play1vsAI"
		}
		let view = this.routes[path];
		if (view) {
			document.title = view.title;
			switch(view.state) {
				case "Home":
					if (document.getElementById("registerForm"))
						this.hideRegisterForm();
					if (document.getElementById("loginForm"))
						this.hideLoginForm();
					this.getHomePage("home");
					break;
				case "Login":
					if (document.getElementById("registerForm"))
						this.hideRegisterForm();
					this.getLoginForm();
					break;
				case "Register":
					if (document.getElementById("loginForm"))
						this.hideLoginForm();
					this.getRegisterForm();
					break;
				case "Play1vsAI":
					if (document.getElementById("registerForm"))
						this.hideRegisterForm();
					if (document.getElementById("loginForm"))
						this.hideLoginForm();
					if (document.getElementById("createGame"))
						this.hideCreateGame();
					this.getHomePage("1vsAI", id);
					break;
			}
		} else {
			history.replaceState("", "", "/");
			this.router();
		}
	}

	//----------------------------------------------------------//
	//					DJANGO-JS COMMUNICATION					//
	//----------------------------------------------------------//

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

	//----------------------------------------------------------//
	//						VIEW UPDATE							//
	//----------------------------------------------------------//

	toggleProfilMenu() {
		let profilMenu = document.getElementById("profilMenu");
		if (this.user.authenticated) {
			this.getApiResponse("/api/view/profilMenu/")
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
		setTimeout(() => {
			let dom = document.getElementById(domId);
			if (dom)
				dom.remove();
		}, 200);
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
				else if (data.message)
					this.handleNewMessage(data);
				else if (data.friendRequest)
					this.handleFriendRequestMessage(data);
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
					this.updateRooms();
					if (state == "home")
						this.getCreateGame();
					else if (state == "1vsAI" && game_id == -1)
						this.getLocalAiConfigPage();
					else if (state == "1vsAI" && game_id != -1)
						this.getLocalAiGame(game_id);
					let homeView = document.getElementById("homeView");
					setTimeout(() => {
						homeView.classList.remove("hided");
					}, 15);
				}
			})
		} else {
			// need to clean current home view and add what the user want...
			if (state == "home")
				this.getCreateGame();
			else if (state == "1vsAI" && game_id == -1) {
				this.hideLocalAiGame();
				this.getLocalAiConfigPage();
			} else if (state == "1vsAI" && game_id != -1) {
				this.hideLocalAiConfigPage();
				this.getLocalAiGame(game_id);
			}
		}
	}

	hideLocalAiGame() {
		let gameOverlay = document.getElementById("gameOverlay");
		if (!gameOverlay)
			return ;
		gameOverlay.classList.add("hided")
		this.remove("gameOverlay")
	}

	getLocalAiGame(id) {
		this.getApiResponseJson("/api/game/get/", {id: id}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				this.pong.game_id = id;
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
							if (res.p1score > res.p2score) {
								if (res.p1.id == -1) {
									endDiv.innerHTML = "A.I. wins this game !"
								} else {
									endDiv.innerHTML = res.p1.username + " wins this game !"
								}
							} else {
								if (res.p2.id == -1) {
									endDiv.innerHTML = "A.I. wins this game !"
								} else {
									endDiv.innerHTML = res.p2.username + " wins this game !"
								}
							}
							endDiv.classList.remove("coundown");
							endDiv.style.fontSize = "5rem"
							endDiv.classList.add("visible");
						}
						console.log('game is finished...')
					} else {
						this.pong.setConfig(res);
//						this.pong.p1.setAI(false);
//						this.pong.p2.setAI(false);
//						this.pong.ToState(this.pong.states.ready);
//						console.log("sdfsdfsdf")
//						setTimeout(()=> {
//							this.animateCountdown(5, res);
//						}, 1000)
					}
				}
			}
		});
	}
	
	hideLocalAiConfigPage() {
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
					document.getElementById("createGame").classList.remove("hided");
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
								let sendPlay = document.getElementById("chatSendPlay")
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
						chatBottom.scrollIntoView()
					}, 15);
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
				setTimeout(() => {
					notif[i].classList.remove("hided")
				}, 15)
				let acceptBtn = notif[i].childNodes[1].childNodes[1];
				acceptBtn.addEventListener("click", this.acceptFriendRequest.bind(this), false);
				let deleteBtn = notif[i].childNodes[1].childNodes[2];
				deleteBtn.addEventListener("click", this.deleteFriendRequest.bind(this), false);
			}
		}
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
								}, 5000);
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

	// a faire
	getRegisterForm() {
		let registerForm = document.getElementById("registerForm");
		this.getApiResponse("/api/view/register/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let topContent = document.getElementById("topContent");
				topContent.innerHTML = res.html;
				let loginForm = document.getElementById("registerForm");
				loginForm.classList.add("trXm100");
				let form = document.getElementById("registerFormForm");
				document.getElementById("registerFormSubmitBtn").addEventListener("click", e => {
					e.preventDefault();
					let formData = new FormData(form);
				});
				setTimeout(() => {
					loginForm.classList.remove("hided");
					loginForm.classList.remove("trXm100");
				}, 15);
			}
		})
	}

	//----------------------------------------------------------//
	//						 SINGLETON							//
	//----------------------------------------------------------//

	static get() {
		if (!this.instance) {
			this.instance = new App();
		}
		return (this.instance);
	}
};

// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   StateMachine.js                                    :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/31 15:09:07 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/06 12:58:55 by gbrunet          ###   ########.fr       //
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
					let res = JSON.parse(response)
					if (res.needUserUpdate)
						this.updateUser();
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
		}
	}

	initUser() {
		this.user = {
			authenticated: false,
			username: "",
		};
	}
	
	updateUser() {
		let prev = this.user.authenticated;
		if (this.getCookie('csrftoken') == null) {
			this.user.authenticated = false;
			this.user.username = "";
			return ;
		}
		this.getApiResponse("/api/user/").then((response) => {
			let user = JSON.parse(response);
			if (user.authenticated) {
				this.user.authenticated = true;
				this.user.username = user.username;
			}
			else {
				this.user.authenticated = false;
				this.user.username = "";
			}
			if (prev != this.user.authenticated)
				this.toggleProfilMenu();
			this.router();
		});
	}

	router(back) {
		let view = this.routes[location.pathname];
		if (view) {
			document.title = view.title;
			switch(view.state) {
				case "Home":
					if (document.getElementById("registerForm"))
						this.hideRegisterForm();
					if (document.getElementById("loginForm"))
						this.hideLoginForm();
					this.getHomePage();
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
			}
		} else {
			history.replaceState("", "", "/");
			this.router();
		}
	}

	//----------------------------------------------------------//
	//                  DJANGO-JS COMMUNICATION                 //
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
	//                      VIEW UPDATE                         //
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

	displayNone(domId) {
		setTimeout(() => {
			let dom = document.getElementById(domId);
			if (dom)
				dom.classList.add("displayNone");
		}, 200);
	}

	getHomePage() {
		if (this.chatSocket)
			this.chatSocket.close();
		this.chatSocket = new WebSocket(
			'wss://' + window.location.host + '/ws/chat/'
		);

		this.chatSocket.onmessage = function(e) {
			const data = JSON.parse(e.data);
			if (data.need_update) {
				this.updateConnectedUsers(data);
			} else if (data.message) {
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
		}.bind(this);

		this.getApiResponse("/api/view/home/").then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let topContent = document.getElementById("topContent");
				topContent.innerHTML = res.html;
				let homeView = document.getElementById("homeView");
				let chatContainer = document.getElementById("chatContainer")
				if (chatContainer) {
					this.getApiResponse("/api/view/chatView/").then((response) => {
						let res = JSON.parse(response);
						if (res.success) {
							chatContainer.innerHTML = res.html;
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
									if (this.chatSocket.readyState === WebSocket.OPEN) {
										this.chatSocket.send(JSON.stringify({
											'message': message
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
				homeView.classList.add("trXm100");
				setTimeout(() => {
					homeView.classList.remove("hided");
					homeView.classList.remove("trXm100");
				}, 15);
			}
		})
	}

	updateConnectedUsers(data) {
		this.getApiResponseJson("/api/view/chatUserView/", {connectedUsers: data.users}).then((response) => {
			let res = JSON.parse(response);
			if (res.success) {
				let connectedUsers = document.getElementById("chatConnectedUsers");
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
						let userBtns = document.getElementsByClassName("user");
						for (let i = 0; i < userBtns.length; i++) {
							if (userBtns[i] != target)
								userBtns[i].classList.remove("selected");
						}
						target.classList.toggle("selected");
						if (target.classList.contains("selected")) {
							let chat = document.getElementById("chatContainer");
							let menu = document.getElementById("menu");
							chat.classList.remove("displayNone");
							menu.classList.remove("displayNone");
							menu.style.pointerEvents = "all";
							setTimeout(() => {
								chat.classList.remove("hided");
								menu.classList.remove("hided");
							}, 15)
						} else {
							let chat = document.getElementById("chatContainer");
							let menu = document.getElementById("menu");
							chat.classList.add("hided");
							menu.classList.add("hided");
							menu.style.pointerEvents = ("none");
							this.displayNone("chatContainer")
							this.displayNone("menu")
						}
					})
				}
			}
		});
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
	//                       SINGLETON                          //
	//----------------------------------------------------------//

	static get() {
		if (!this.instance) {
			this.instance = new App();
		}
		return (this.instance);
	}
};

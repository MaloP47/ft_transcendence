// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   StateMachine.js                                    :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/31 15:09:07 by gbrunet           #+#    #+#             //
//   Updated: 2024/05/31 16:16:27 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

export default class App {
	constructor() {
		this.initUser();
	}

	initUser() {
		this.user = {
			authenticated: false,
			username: "",
		};
	}
	
	updateUser() {
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
			this.updateView();
		});
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
			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
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
			xhr.send(data);
		});
	}

	

	async getApiResponse(url) {
		return await this.makeApiRequest(url);
	}

	//----------------------------------------------------------//
	//                                               //
	//----------------------------------------------------------//

	//----------------------------------------------------------//
	//                      VIEW UPDATE                         //
	//----------------------------------------------------------//

	updateView() {
		this.toggleProfilMenu();
		this.toggleLoginForm();
	}

	toggleProfilMenu() {
		let profilMenu = document.getElementById("profilMenu");
		if (this.user.authenticated) {
			this.getApiResponse("/api/view/profilMenu/")
				.then((response) => {
					let res = JSON.parse(response);
					if (res.success) {
						profilMenu.innerHTML = res.html;
						let username = document.getElementById("navBarUsername");
						username.innerHTML = this.user.username;
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

	toggleLoginForm() {
		console.log(Appli.get());
		let loginForm = document.getElementById("loginForm");
		if (this.user.authenticated) {
			if (loginForm) {
				loginForm.classList.add("hided");
				loginForm.classList.add("trXp100");
				setTimeout(() => {
					loginForm.remove();
				}, 200);
			}
		} else {
			this.getApiResponse("/api/view/login/").then((response) => {
				let res = JSON.parse(response);
				if (res.success) {
					let topContent = document.getElementById("topContent");
					topContent.innerHTML += res.html;
					let loginForm = document.getElementById("loginForm");
					loginForm.classList.add("trXm100");
					document.getElementById("submitBtn").addEventListener("click", e => {
						e.preventDefault();
						console.log(document.getElementById("loginFormUsername").value());
						console.log(document.getElementById("loginFormPassword").value());
						console.log(e);
					});
					setTimeout(() => {
						loginForm.classList.remove("hided");
						loginForm.classList.remove("trXm100");
					}, 15);
				}
			})
		}
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

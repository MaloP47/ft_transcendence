// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Pong.js                                            :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/21 13:52:15 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/13 16:02:10 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';

import LinearSpline from './LinearSpline.js';
import BallParticles from './BallParticles.js';
import ImpactParticles from './ImpactParticles.js';
import BonusParticles from './BonusParticles.js';
import BallFire from './BallFire.js';
import Bonus from './Bonus.js';
import Ball from './Ball.js';
import Player from './Player.js';
import App from './../state/StateMachine.js';

import bgVertexShader from './assets/shaders/bgV.js'
import bgFragmentShader from './assets/shaders/bgF.js'

import playerVertexShader from './assets/shaders/playerV.js'
import playerFragmentShader from './assets/shaders/playerF.js'

import fadeVertexShader from './assets/shaders/fadeV.js'
import fadeFragmentShader from './assets/shaders/fadeF.js'

import dotVertexShader from './assets/shaders/dotV.js'
import dotFragmentShader from './assets/shaders/dotF.js'

import vignetteVertexShader from './assets/shaders/vignetteV.js'
import vignetteFragmentShader from './assets/shaders/vignetteF.js'

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

function add(val, add, max) {
	if (val < 0) val = 0;
	return (Math.min(val + add, max));
}

function sub(val, sub, max) {
	if (val > 0) val = 0;
	return (Math.max(val - sub, -max));
}

export default class Pong {
	constructor() {
		this.InitThreeJs();
		this.InitKeys();
		this.InitMesh();
		this.InitGameAssets();
		this.InitEvents();
		this.InitGameVariable();
		this.InitStates();
		this.Animate();
	//	this.ToState(this.states.ready)
	}

	InitThreeJs() {
		this.threejs = new THREE.WebGLRenderer({
			antialias: true,
		});
		this.threejs.setSize(WIDTH, HEIGHT);
		this.threejs.setPixelRatio(window.devicePixelRatio * 0.50)
		this.canvas = document.getElementById('canvas').appendChild(this.threejs.domElement);
		this.camera = new THREE.PerspectiveCamera(58, WIDTH / HEIGHT, 0.1, 1000);
		this.camera.position.set(0, 0, 27);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.scene = new THREE.Scene();	
		this.scene.background = new THREE.Color(0x596077);
		this.composer = new EffectComposer(this.threejs);
		const renderPass = new RenderPass( this.scene, this.camera );
		this.composer.addPass( renderPass );
		this.dot = new ShaderPass(new THREE.ShaderMaterial({
			uniforms: {
				'tDiffuse': {value: null},
				'tSize': {value: new THREE.Vector2(256, 256)},
				'center': {value: new THREE.Vector2(0.5, 0.5)},
				'angle': {value: 1.57},
				'scale': {value: 4.0},
				'amount': {value: 1.0}
			},
			vertexShader: dotVertexShader,
			fragmentShader: dotFragmentShader,
		}));
		this.composer.addPass(this.dot);
		this.fade = new ShaderPass(new THREE.ShaderMaterial({
			uniforms: {
				'tDiffuse': { value: null },
				'amount': {value: 0}
			},
			vertexShader: fadeVertexShader,
			fragmentShader: fadeFragmentShader,
		}));
		this.composer.addPass(this.fade);
		this.vignette = new ShaderPass(new THREE.ShaderMaterial({
			uniforms: {
				'tDiffuse': { value: null },
				'amount': {value: 1},
				'lines': {value: HEIGHT / 4},
				'time': {value: this.totalTime},
			},
			vertexShader: vignetteVertexShader,
			fragmentShader: vignetteFragmentShader,
		}));
		this.composer.addPass(this.vignette);
	}

	InitKeys() {
		this.p1LeftKey = 65;
		this.p1RightKey = 68;
		this.p2LeftKey = 37;
		this.p2RightKey = 39;
		this.p1Right = false;
		this.p1Left = false;
		this.p1Right = false;
		this.p2Left = false;
		this.p2Right = false;
	}

	InitMesh() {
		this.backPlaneGeo = new THREE.PlaneGeometry(15.5, 21.5);
		this.bgShader = new THREE.ShaderMaterial({
			vertexShader: bgVertexShader,
			fragmentShader: bgFragmentShader,
		});
		this.backPlane = new THREE.Mesh(this.backPlaneGeo, this.bgShader);
		this.backPlane.position.z = -0.4;
		this.scene.add(this.backPlane);

		this.playerPlaneGeo = new THREE.PlaneGeometry(15.5, 21.5);
		this.playerShader = new THREE.ShaderMaterial({
			vertexShader: playerVertexShader,
			fragmentShader: playerFragmentShader,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: false,
			transparent: true,
		});
		this.playerPlane = new THREE.Mesh(this.playerPlaneGeo, this.playerShader);
		this.scene.add(this.playerPlane);
	}

	InitGameAssets() {
		this.ball = new Ball({pong: this});
		this.ballFire = new BallFire({pong: this});
		this.ballParticles = new BallParticles({pong: this});
		this.impactParticles = new ImpactParticles({pong: this});

		this.bonus = new Bonus({pong: this});
		this.bonusParticles = new BonusParticles({pong: this});

		this.p1 = new Player({pong: this, player:1});
		this.p2 = new Player({pong: this, player:2});
		this.p2.setAI(true);
		this.p1.setAI(true);
	}

	InitEvents() {
		document.addEventListener("keydown", onDocumentKeyDown.bind(this), false);
		function onDocumentKeyDown(event) {
			var keyCode = event.which;
			if (keyCode == this.p1LeftKey && !this.p1Left && !this.p1.AI) {
				this.p1Left = true;
			} else if (keyCode == this.p1RightKey && !this.p1Right && !this.p1.AI) {
				this.p1Right = true;
			} else if (keyCode == this.p2LeftKey && !this.p2Left && !this.p2.AI) {
				this.p2Left = true;
			} else if (keyCode == this.p2RightKey && !this.p2Right && !this.p2.AI) {
				this.p2Right = true;
			}
		};
		document.addEventListener("keyup", onDocumentKeyUp.bind(this), false);
		function onDocumentKeyUp(event) {
			var keyCode = event.which;
			if (keyCode == this.p1LeftKey && this.p1Left && !this.p1.AI) {
				this.p1Left = false;
			} else if (keyCode == this.p1RightKey && this.p1Right && !this.p1.AI) {
				this.p1Right = false;
			} else if (keyCode == this.p2LeftKey && this.p2Left && !this.p2.AI) {
				this.p2Left = false;
			} else if (keyCode == this.p2RightKey && this.p2Right && !this.p2.AI) {
				this.p2Right = false;
			} else if (keyCode == 32) {
			//	this.start = true;
				if (this.currentState == this.states.ready && this.currentState.status == "active" && !this.start) {
					this.start = true;
					this.p2.setAI(true);
					this.p2.startAI();
				}
			}
		};
		window.addEventListener('resize', () => {
			// Update sizes
			WIDTH = window.innerWidth;
			HEIGHT = window.innerHeight;
			// Update camera
			this.camera.aspect = WIDTH / HEIGHT;
			this.camera.updateProjectionMatrix();
			// Update renderer
			this.threejs.setSize(WIDTH, HEIGHT);
			this.composer.setSize(WIDTH, HEIGHT);
			this.vignette.uniforms['lines'].value = HEIGHT / 4;
		});
	}

	InitGameVariable() {
		// GAME INFO TRACKING
		this.totalTime = 0;
		this.elapsedTime = 0;
		this.lastHit = 0;
		this.exchange = 0;
		this.start = false;
		this.endRound = false;
		this.transiWaitScreen = 0;
		this.waitScreen = true;
	}

	InitStates() {
		this.states = {
			black: {
				status: "in",
				time: 0,
				inTime: 500,
				outTime: 0,
				fadeIn(pong) {
					this.time += pong.elapsedTime;
					if (this.time > this.inTime) {
						this.status = "active";
						this.time = 0;
					}
				},
				run(pong) {
					pong.ToState(pong.states.login);
				},
				fadeOut(pong) {
					this.status = "in";
				}
			},
			login: {
				status: "in",
				time: 0,
				inTime: 1500,
				outTime: 1500,
				fadeIn(pong) {
					this.time += pong.elapsedTime;
					pong.vignette.uniforms['amount'].value = 0;
					var progress = pong.easeOutCubic(Math.min(this.time / this.inTime, 1));
					pong.fade.uniforms['amount'].value = progress * 0.5;
					pong.camera.position.set(Math.cos(pong.totalTime / 3000) * 18, Math.sin(pong.totalTime / 2000) * 18, Math.sin(pong.totalTime / 2500) * 7 + 18 + (1 - progress) * 100);
					pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
					pong.camera.rotation.z = pong.totalTime / 2000 + 3.1415 / 2 - (1 - progress) * 3;
					if (this.time > this.inTime) {
						this.status = "active";
						pong.p1.startAI();
						pong.p2.startAI();
						this.time = 0;
					}
				},
				run(pong) {
					pong.camera.position.set(Math.cos(pong.totalTime / 3000) * 18, Math.sin(pong.totalTime / 2000) * 18, Math.sin(pong.totalTime / 2500) * 7 + 18);
					pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
					pong.camera.rotation.z = pong.totalTime / 2000 + 3.1415 / 2;
					pong.p1.Update();
					pong.p2.Update();
					pong.ball.Update();
					pong.ballFire.Update();
					pong.impactParticles.Update();
					pong.bonus.Update();
					pong.bonusParticles.Update();
					pong.ballParticles.Update();
				},
				fadeOut(pong) {
					this.time += pong.elapsedTime;
					var progress = pong.easeInCubic(Math.min(this.time / this.inTime, 1));
					pong.fade.uniforms['amount'].value = (1 - progress) * 0.5;
					pong.camera.position.set(Math.cos(pong.totalTime / 3000) * 18, Math.sin(pong.totalTime / 2000) * 18, Math.sin(pong.totalTime / 2500) * 7 + 18 + progress * 100);
					pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
					pong.camera.rotation.z = pong.totalTime / 2000 + 3.1415 / 2 - progress * 3;
					pong.p1.Update();
					pong.p2.Update();
					pong.ball.Update();
					pong.ballFire.Update();
					pong.impactParticles.Update();
					pong.bonus.Update();
					pong.bonusParticles.Update();
					pong.ballParticles.Update();
					if (this.time > this.outTime) {
						this.status = "in";
						this.time = 0;
						pong.p1.reset();
						pong.p2.reset();
						pong.camera.position.set(0, 0, 27);
						pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
						pong.bonus.reset();
						pong.bonusParticles.reset();
						pong.ball.reset();
						pong.ballFire.reset();
						pong.impactParticles.reset();
						pong.ballParticles.reset();
					}
				}
			},
			ready: {
				status: "in",
				time: 0,
				inTime: 1500,
				outTime: 1000,
				fadeIn(pong) {
					this.time += pong.elapsedTime;
					pong.vignette.uniforms['amount'].value = 1;
					var progress = pong.easeOutCubic(Math.min(this.time / this.inTime, 1));
					if (HEIGHT < 800) {
						pong.camera.position.set(0, (1 - progress) * -20 - 11, 17 + (800 - HEIGHT) / 70);
						pong.camera.lookAt(new THREE.Vector3(0, progress * (1 - (HEIGHT / 800) * 3), 0));
					} else {
						pong.camera.position.set(0, (1 - progress) * -20 - 11, 17 + (1 - progress) * 10);
						pong.camera.lookAt(new THREE.Vector3(0, progress * -2, 0));	
					}
					pong.fade.uniforms['amount'].value = Math.min(progress, 0.75) / 0.75;
					pong.dot.uniforms['amount'].value = 1 - Math.max(progress - 0.25, 0) / 0.75;
					if (this.time > this.inTime) {
						this.status = "active";
						this.time = 0;
					}
				},
				run(pong) {
					if (HEIGHT < 800) {
						pong.camera.position.set(0, -11, 17 + (800 - HEIGHT) / 70);
						pong.camera.lookAt(new THREE.Vector3(0, 1 - (HEIGHT / 800) * 3, 0));
					} else {
						pong.camera.position.set(0, -11, 17);
						pong.camera.lookAt(new THREE.Vector3(0, -2, 0));	
					}
					if (pong.start) {
						pong.p1.Update();
						pong.p2.Update();
						pong.ball.Update();
						pong.ballFire.Update();
						pong.impactParticles.Update();
						pong.bonus.Update();
						pong.bonusParticles.Update();
						pong.ballParticles.Update();
					} else {
						pong.p1.reset();
						pong.p2.reset();
					}
				},
				fadeOut(pong) {
					this.time += pong.elapsedTime;
					var progress = pong.easeInCubic(Math.min(this.time / this.outTime, 1));
					pong.fade.uniforms['amount'].value = 1 - progress;
					if (HEIGHT < 800) {
						pong.camera.position.set(0, (progress) * -20 - 11, 17 + (800 - HEIGHT) / 70);
						pong.camera.lookAt(new THREE.Vector3(0, progress * ((HEIGHT / 800) * 3), 0));
					} else {
						pong.camera.position.set(0, (progress) * -20 - 11, 17 + (progress) * 10);
						pong.camera.lookAt(new THREE.Vector3(0, (1 - progress) * -2, 0));	
					}
					if (this.time > this.outTime) {
						this.status = "in";
						this.time = 0;
						pong.p1.reset();
						pong.p2.reset();
						pong.camera.position.set(0, 0, 27);
						pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
						pong.bonus.reset();
						pong.bonusParticles.reset();
						pong.ball.reset();
						pong.ballFire.reset();
						pong.impactParticles.reset();
						pong.ballParticles.reset();
						pong.dot.uniforms['amount'].value = 1;
					}
				}
			}
		}
		this.prevState = undefined;
		this.currentState = this.states.black;
	}

	CheckState() {
		if (this.prevState && this.prevState.status == "active") {
			this.prevState.fadeOut(this);
			return ;
		}
		if (this.currentState.status == "in") {
			this.currentState.fadeIn(this);
			return ;
		}
		if (this.currentState.status == "active") {
			this.currentState.run(this);
		}
		if (this.currentState.status == "out") {
			this.currentState.fadeOut(this);
			return ;
		}
	}

	ToState(state) {
		if (this.currentState == state)
			return ;
		this.prevState = this.currentState;
		this.currentState = state;
	}

	Animate() {
		this.elapsedTime = performance.now() - this.totalTime;
		this.totalTime = performance.now()
		
		this.CheckState();
		this.UpdateShaders();

		requestAnimationFrame(this.Animate.bind(this));

		if ((!this.p1.bonus.reversed.on && this.p1Left) || (this.p1.bonus.reversed.on && this.p1Right))
			this.p1.subSpeed();
		if ((!this.p1.bonus.reversed.on && this.p1Right) || (this.p1.bonus.reversed.on && this.p1Left))
			this.p1.addSpeed();
		if ((!this.p2.bonus.reversed.on && this.p2Left) || (this.p2.bonus.reversed.on && this.p2Right))
			this.p2.subSpeed();
		if ((!this.p2.bonus.reversed.on && this.p2Right) || (this.p2.bonus.reversed.on && this.p2Left))
			this.p2.addSpeed();
		/*

		this.p1.Update();
		this.p2.Update();

		
		if (this.start) {
			if (this.transiWaitScreen < 1)
				this.transiWaitScreen = Math.min(this.transiWaitScreen + this.elapsedTime / 1000, 1);
		}
		if (this.start || this.waitScreen) {
			this.ball.Update();
			this.ballFire.Update();
			this.impactParticles.Update();
			this.bonus.Update();
			this.bonusParticles.Update();
			this.ballParticles.Update();
		}
		if (this.waitScreen) {
			this.camera.position.set(Math.cos(this.totalTime / 3000) * 20, Math.sin(this.totalTime / 2000) * 20, Math.sin(this.totalTime / 2500) * 7 + 23);
			this.camera.lookAt(new THREE.Vector3(0, 0, 0));
			this.camera.rotation.z = this.totalTime / 2000 + 3.1415 / 2;
			if (this.transiWaitScreen != 0) {
				this.endRound = true;
				var initCam = {
					p: {
						x: this.camera.position.x,
						y: this.camera.position.y,
						z: this.camera.position.z,
					},
					r:{
						x: this.camera.rotation.x % 6.283185307,
						y: this.camera.rotation.y % 6.283185307,
						z: this.camera.rotation.z % 6.283185307,
					}
				}
				this.camera.position.set(0, 0, 27);
				this.camera.lookAt(new THREE.Vector3(0, 0, 0));
				this.camera.rotation.z = 0;
				var endCam = {
					p: {
						x: this.camera.position.x,
						y: this.camera.position.y,
						z: this.camera.position.z,
					},
					r:{
						x: this.camera.rotation.x % 6.283185307,
						y: this.camera.rotation.y % 6.283185307,
						z: this.camera.rotation.z % 6.283185307,
					}
				}
				this.LerpCamera(initCam, endCam, this.transiWaitScreen);
				if (this.transiWaitScreen == 1) {
					this.waitScreen = false;
					this.p1.stopAI();
					this.p2.stopAI();
					this.totalTime = 0;
					this.elapsedTime = 0;
					this.lastHit = 0;
					this.exchange = 0;
					this.start = false;
					this.ball.ball.position.x = 0;
					this.ball.ball.position.y = 0;
					this.p1.bar.position.x = 0;
					this.p2.bar.position.x = 0;
				}
			}
		}
		*/
		// end temp
		this.composer.render();
	}

	UpdateShaders() {
		this.vignette.material.uniforms.time = {value: this.totalTime};
		this.bonusParticles.particleShader.uniforms.uCenter = {value: this.bonus.getPos()};
		this.bonusParticles.particleShader.uniforms.uType = {value: this.bonus.type};
		this.ballParticles.particleShader.uniforms.uTime = {value: this.totalTime};
		this.bgShader.uniforms.uInfos = {
			value: {
				p1Pos: [this.p1.getPos().x, this.p1.getPos().y],
				p2Pos: [this.p2.getPos().x, this.p2.getPos().y],
				time: this.totalTime,
				p1Bonus: this.p1.bonus,
				p2Bonus: this.p2.bonus,
			}
		}
		this.playerShader.uniforms.uInfos = {
			value: {
				p1Pos: [this.p1.getPos().x, this.p1.getPos().y],
				p2Pos: [this.p2.getPos().x, this.p2.getPos().y],
				time: this.totalTime,
				p1Bonus: this.p1.bonus,
				p2Bonus: this.p2.bonus,
			}
		}
		this.bonus.material.uniforms.uTime = {value: this.totalTime};
		this.bonus.material.uniforms.uType = {value: this.bonus.type};
	}

	Smooth(t) {
		var sqr = t * t;
		return (sqr / (2 * (sqr - t) + 1));
	}

	easeInCubic(t) {
		return (t * t * t);
	}

	easeOutCubic(t) {
		return (1 - Math.pow(1 - t, 3));
	}

	LerpCamera(initCam, endCam, t) {
		var sqr = t * t;
		var smooth = sqr / (2 * (sqr - t) + 1);
//		if (initCam.r.x > 3.141592653) {initCam.r.x -= 6.283185307}
//		if (initCam.r.y > 3.141592653) {initCam.r.y -= 6.283185307}
//		if (initCam.r.z > 3.141592653) {initCam.r.z -= 6.283185307}
//		if (endCam.r.x > 3.141592653) {endCam.r.x -= 6.283185307}
//		if (endCam.r.y > 3.141592653) {endCam.r.y -= 6.283185307}
//		if (endCam.r.z > 3.141592653) {endCam.r.z -= 6.283185307}
		this.camera.position.x = (1 - smooth) * initCam.p.x + smooth * endCam.p.x;
		this.camera.position.y = (1 - smooth) * initCam.p.y + smooth * endCam.p.y;
		this.camera.position.z = (1 - smooth) * initCam.p.z + smooth * endCam.p.z;
		this.camera.rotation.x = (1 - smooth) * initCam.r.x + smooth * endCam.r.x;
		this.camera.rotation.y = (1 - smooth) * initCam.r.y + smooth * endCam.r.y;
		this.camera.rotation.z = (1 - smooth) * initCam.r.z + smooth * endCam.r.z;
	}
}

let APP = null;

class Transcendence {
	constructor() {
		this.pong = new Pong();
		window.addEventListener("click", e => {
			if (e.target.matches("[data-api]")) {
				e.preventDefault();
				this.getApiResponse(e.target.dataset.api).then((val) => {
					console.log(val);
					this.updateUser();
				});
			}
		});
		this.initUser();
		this.updateUser();
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

/*
window.addEventListener("popstate", router);
window.addEventListener("DOMContentLoaded", router);
	let home = "<h1>home</h1>";
	let about = "<h1>about</h1>";
	const routes = {
		"/": {title: "home", render: home},
		"/about": {title: "about", render: about}
	}

function router() {
	let view = routes[location.pathname];

	if (view) {
		document.title = view.title;
		document.getElementById('test').innerHTML = view.render;
	} else {
		history.replaceState("", "", "/");
		router();
	}
}*/

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

	makeApiRequest(url) {
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
			xhr.send();
		});
	}

	async getApiResponse(url) {
		return await this.makeApiRequest(url);
	}

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
}

// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Pong.js                                            :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/21 13:52:15 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/14 17:15:07 by gbrunet          ###   ########.fr       //
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

class PongAssets {
	constructor(data) {
		this.pong = data.pong;
		this.initAssets();
	}

	initAssets() {
		this.ball = new Ball({pong: this.pong});
//		this.ballFire = new BallFire({pong: this});
//		this.ballParticles = new BallParticles({pong: this});
//		this.impactParticles = new ImpactParticles({pong: this});

//		this.bonus = new Bonus({pong: this});
//		this.bonusParticles = new BonusParticles({pong: this});

		this.p1 = new Player({pong: this, player:1});
		this.p2 = new Player({pong: this, player:2});
//		this.p1.setAI(true);
//		this.p2.setAI(true);
	}
	
}

class PongScene {
	constructor(data) {
		this.pong = data.pong;
		this.initScene();
		this.initMesh();
	}

	initScene() {
		this.threeJs = new THREE.WebGLRenderer({
			antialias: true,
		});
		this.threeJs.setSize(WIDTH, HEIGHT);
		this.threeJs.setPixelRatio(window.devicePixelRatio * 1)
		this.canvas = document.getElementById('canvas').appendChild(this.threeJs.domElement);
		this.camera = new THREE.PerspectiveCamera(58, WIDTH / HEIGHT, 0.1, 1000);
		this.camera.position.set(0, 0, 27);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.scene = new THREE.Scene();	
		this.scene.background = new THREE.Color(0x596077);
		this.composer = new EffectComposer(this.threeJs);
		const renderPass = new RenderPass(this.scene, this.camera);
		this.composer.addPass(renderPass);
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
				'amount': {value: 1}					// NEED TO PUT 0 HERE
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

	initMesh() {
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

	add(obj) {
		this.scene.add(obj);
	}

	update() {
		this.updateShaders();
		this.composer.render();
	}

	updateShaders() {
		this.vignette.material.uniforms.time = {value: this.totalTime};
		if (this.bonusParticles) {
			this.bonusParticles.particleShader.uniforms.uCenter = {value: this.bonus.getPos()};
			this.bonusParticles.particleShader.uniforms.uType = {value: this.bonus.type};
		}
		if (this.ballParticles)
			this.ballParticles.particleShader.uniforms.uTime = {value: this.totalTime};
		this.bgShader.uniforms.uInfos = {
			value: {
				p1Pos: [this.pong.assets.p1.getPos().x, this.pong.assets.p1.getPos().y],
				p2Pos: [this.pong.assets.p2.getPos().x, this.pong.assets.p2.getPos().y],
				time: this.pong.totalTime,
				p1Bonus: this.pong.assets.p1.bonus,
				p2Bonus: this.pong.assets.p2.bonus,
			}
		}
		this.playerShader.uniforms.uInfos = {
			value: {
				p1Pos: [this.pong.assets.p1.getPos().x, this.pong.assets.p1.getPos().y],
				p2Pos: [this.pong.assets.p2.getPos().x, this.pong.assets.p2.getPos().y],
				time: this.pong.totalTime,
				p1Bonus: this.pong.assets.p1.bonus,
				p2Bonus: this.pong.assets.p2.bonus,
			}
		}
		if (this.bonus) {
			this.bonus.material.uniforms.uTime = {value: this.totalTime};
			this.bonus.material.uniforms.uType = {value: this.bonus.type};
		}
	}

	resize() {
		this.camera.aspect = WIDTH / HEIGHT;
		this.camera.updateProjectionMatrix();
		this.threeJs.setSize(WIDTH, HEIGHT);
		this.composer.setSize(WIDTH, HEIGHT);
		this.vignette.uniforms['lines'].value = HEIGHT / 4;
	}
}

class PongTransi {
	constructor(data) {
		this.pong = data.pong;
		this.active = false;
		this.transi = ""
	}

	toBlack(time) {
		if (!this.active && time != undefined) {
			this.active = true;
			this.transi = "toBlack";
			this.time = 0;
			this.transiTime = time;
			this.startCamPos = this.pong.scene.camera.position.clone();
			this.startCamRot = this.pong.scene.camera.rotation.clone();
  			return new Promise(resolve => setTimeout(resolve, time));
		}
		if (this.time > this.transiTime) {
			this.active = false;
			return ;
		}
		this.time += this.pong.elapsedTime;
		let progress = this.easeInCubic(Math.min(this.time / this.transiTime, 1));
		this.pong.scene.fade.uniforms['amount'].value = (1 - progress) * 0.5;
		this.pong.scene.camera.position.set(
			progress * (-500 - this.startCamPos.x) + this.startCamPos.x,
			progress * (-500 - this.startCamPos.y) + this.startCamPos.y,
			progress * (500 - this.startCamPos.z) + this.startCamPos.z
		);
		this.pong.scene.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.pong.scene.camera.rotation.z = progress * (-5 - this.startCamRot.z) + this.startCamRot.z;
/*					pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
					pong.camera.rotation.z = pong.totalTime / 2000 + 3.1415 / 2 - progress * 3;
					pong.p1.Update();
					pong.p2.Update();
					pong.ball.Update();
					if (pong.ballFire)
						pong.ballFire.Update();
					if (pong.impactParticles)
						pong.impactParticles.Update();
					if (pong.bonus)
						pong.bonus.Update();
					if (pong.bonusParticles)
						pong.bonusParticles.Update();
					if (pong.ballParticles)
						pong.ballParticles.Update();
					if (this.time > this.outTime) {
						this.status = "in";
						this.time = 0;
						pong.p1.reset();
						pong.p2.reset();
						pong.camera.position.set(0, 0, 27);
						pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
						pong.ball.reset();
						if (pong.bonus)
							pong.bonus.reset();
						if (pong.bonusParticles)
							pong.bonusParticles.reset();
						if (pong.ballFire)
							pong.ballFire.reset();
						if (pong.impactParticles)
							pong.impactParticles.reset();
						if (pong.ballParticles)
							pong.ballParticles.reset();
					}
		*/
	}

	easeInCubic(t) {
		return (t * t * t);
	}

	easeOutCubic(t) {
		return (1 - Math.pow(1 - t, 3));
	}

	update() {
		if (!this.active)
			return ;
		if (this.transi == "toBlack")
			this.toBlack();
	}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default class Pong {
	constructor(data) {
		this.initKeys();
		this.initEvents();
		this.initGameVariable();
		this.scene = new PongScene({pong: this});
		this.assets = new PongAssets({pong: this});
		this.transi = new PongTransi({pong: this});

		sleep(500).then(() => {
			this.transi.toBlack(1500).then(() => {console.log("fin mon gars")});
		})

		this.update();
	}

	initKeys() {
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
	
	initEvents() {
		document.addEventListener("keydown", onDocumentKeyDown.bind(this), false);
		document.addEventListener("keyup", onDocumentKeyUp.bind(this), false);
		window.addEventListener('resize', onResizeEvent.bind(this), false);

		function onDocumentKeyDown(event) {
			var keyCode = event.which;
			if (keyCode == this.p1LeftKey && !this.p1Left && !this.assets.p1.AI)
				this.p1Left = true;
			else if (keyCode == this.p1RightKey && !this.p1Right && !this.assets.p1.AI)
				this.p1Right = true;
			else if (keyCode == this.p2LeftKey && !this.p2Left && !this.assets.p2.AI)
				this.p2Left = true;
			else if (keyCode == this.p2RightKey && !this.p2Right && !this.assets.p2.AI)
				this.p2Right = true;
		}

		function onDocumentKeyUp(event) {
			var keyCode = event.which;
			if (keyCode == this.p1LeftKey && this.p1Left && !this.assets.p1.AI)
				this.p1Left = false;
			else if (keyCode == this.p1RightKey && this.p1Right && !this.assets.p1.AI)
				this.p1Right = false;
			else if (keyCode == this.p2LeftKey && this.p2Left && !this.assets.p2.AI)
				this.p2Left = false;
			else if (keyCode == this.p2RightKey && this.p2Right && !this.assets.p2.AI)
				this.p2Right = false
		}

		function onResizeEvent() {
			WIDTH = window.innerWidth;
			HEIGHT = window.innerHeight;
			this.scene.resize();
		}
	}

	initGameVariable() {
		this.totalTime = 0;
		this.elapsedTime = 0;
		this.lastHit = 0;
		this.exchange = 0;
		this.start = false;
		this.endRound = false;
		this.transiWaitScreen = 0;
		this.waitScreen = true;
		this.winScore = 10;
	}

	update() {
		this.elapsedTime = performance.now() - this.totalTime;
		this.totalTime = performance.now()

		this.transi.update();
		this.scene.update();
//		this.CheckState();
//		this.UpdateShaders();

		requestAnimationFrame(this.update.bind(this));

//		if ((!this.p1.bonus.reversed.on && this.p1Left) || (this.p1.bonus.reversed.on && this.p1Right))
//			this.p1.subSpeed();
//		if ((!this.p1.bonus.reversed.on && this.p1Right) || (this.p1.bonus.reversed.on && this.p1Left))
//			this.p1.addSpeed();
//		if ((!this.p2.bonus.reversed.on && this.p2Left) || (this.p2.bonus.reversed.on && this.p2Right))
//			this.p2.subSpeed();
//		if ((!this.p2.bonus.reversed.on && this.p2Right) || (this.p2.bonus.reversed.on && this.p2Left))
//			this.p2.addSpeed();
	}
}

class PongOld {
	constructor(data) {
//		this.InitThreeJs();
//		this.InitKeys();
//		this.InitMesh();
//		this.InitGameAssets();
//		this.InitEvents();
//		this.InitGameVariable();
		this.InitStates();
		this.Animate();
	//	this.ToState(this.states.ready)
	}

/*	InitThreeJs() {
		this.threejs = new THREE.WebGLRenderer({
			antialias: true,
		});
		this.threejs.setSize(WIDTH, HEIGHT);
		this.threejs.setPixelRatio(window.devicePixelRatio * 1)
		this.canvas = document.getElementById('canvas').appendChild(this.threejs.domElement);
		this.camera = new THREE.PerspectiveCamera(58, WIDTH / HEIGHT, 0.1, 1000);
		this.camera.position.set(0, 0, 27);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.scene = new THREE.Scene();	
		this.scene.background = new THREE.Color(0x596077);
		this.composer = new EffectComposer(this.threejs);
		const renderPass = new RenderPass( this.scene, this.camera );
		this.composer.addPass(renderPass);
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
//		this.ballFire = new BallFire({pong: this});
//		this.ballParticles = new BallParticles({pong: this});
//		this.impactParticles = new ImpactParticles({pong: this});

//		this.bonus = new Bonus({pong: this});
//		this.bonusParticles = new BonusParticles({pong: this});

		this.p1 = new Player({pong: this, player:1});
		this.p2 = new Player({pong: this, player:2});
		this.p1.setAI(true);
		this.p2.setAI(true);
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
		this.winScore = 10;
	}
*/
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
					pong.camera.position.set(
						Math.cos(pong.totalTime / 3000) * 18,
						Math.sin(pong.totalTime / 2000) * 18,
						Math.sin(pong.totalTime / 2500) * 7 + 18 + (1 - progress) * 100
					);
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
					pong.camera.position.set(
						Math.cos(pong.totalTime / 3000) * 18,
						Math.sin(pong.totalTime / 2000) * 18,
						Math.sin(pong.totalTime / 2500) * 7 + 18
					);
					pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
					pong.camera.rotation.z = pong.totalTime / 2000 + 3.1415 / 2;
					pong.p1.Update();
					pong.p2.Update();
					pong.ball.Update();
					if (pong.ballFire)
						pong.ballFire.Update();
					if (pong.impactParticles)
						pong.impactParticles.Update();
					if (pong.bonus)
						pong.bonus.Update();
					if (pong.bonusParticles)
						pong.bonusParticles.Update();
					if (pong.ballParticles)
						pong.ballParticles.Update();
				},
				fadeOut(pong) {
					this.time += pong.elapsedTime;
					var progress = pong.easeInCubic(Math.min(this.time / this.inTime, 1));
					pong.fade.uniforms['amount'].value = (1 - progress) * 0.5;
					pong.camera.position.set(
						Math.cos(pong.totalTime / 3000) * 18,
						Math.sin(pong.totalTime / 2000) * 18,
						Math.sin(pong.totalTime / 2500) * 7 + 18 + progress * 100
					);
					pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
					pong.camera.rotation.z = pong.totalTime / 2000 + 3.1415 / 2 - progress * 3;
					pong.p1.Update();
					pong.p2.Update();
					pong.ball.Update();
					if (pong.ballFire)
						pong.ballFire.Update();
					if (pong.impactParticles)
						pong.impactParticles.Update();
					if (pong.bonus)
						pong.bonus.Update();
					if (pong.bonusParticles)
						pong.bonusParticles.Update();
					if (pong.ballParticles)
						pong.ballParticles.Update();
					if (this.time > this.outTime) {
						this.status = "in";
						this.time = 0;
						pong.p1.reset();
						pong.p2.reset();
						pong.camera.position.set(0, 0, 27);
						pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
						pong.ball.reset();
						if (pong.bonus)
							pong.bonus.reset();
						if (pong.bonusParticles)
							pong.bonusParticles.reset();
						if (pong.ballFire)
							pong.ballFire.reset();
						if (pong.impactParticles)
							pong.impactParticles.reset();
						if (pong.ballParticles)
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
						pong.camera.position.set(0, (1 - progress) * -20 - 13, 20 + (800 - HEIGHT) / 20);
						pong.camera.lookAt(new THREE.Vector3(0, progress * (2 - (HEIGHT / 800) * 4), 0));
					} else {
						pong.camera.position.set(0, (1 - progress) * -20 - 13, 20 + (1 - progress) * 10);
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
						pong.camera.position.set(0, -13, 20 + (800 - HEIGHT) / 20);
						pong.camera.lookAt(new THREE.Vector3(0, 2 - (HEIGHT / 800) * 4, 0));
					} else {
						pong.camera.position.set(0, -13, 20);
						pong.camera.lookAt(new THREE.Vector3(0, -2, 0));	
					}
					if (pong.start) {
						pong.p1.Update();
						pong.p2.Update();
						pong.ball.Update();
						if (pong.ballFire)
							pong.ballFire.Update();
						if (pong.impactParticles)
							pong.impactParticles.Update();
						if (pong.bonus)
							pong.bonus.Update();
						if (pong.bonusParticles)
							pong.bonusParticles.Update();
						if (pong.ballParticles)
							pong.ballParticles.Update();
					}
				},
				fadeOut(pong) {
					this.time += pong.elapsedTime;
					var progress = pong.easeInCubic(Math.min(this.time / this.outTime, 1));
					pong.fade.uniforms['amount'].value = 1 - progress;
					if (HEIGHT < 800) {
						pong.camera.position.set(0, (progress) * -20 - 13, 20 + (800 - HEIGHT) / 20);
						pong.camera.lookAt(new THREE.Vector3(0, (1 - progress) * (2 - (HEIGHT / 800) * 4), 0));
					} else {
						pong.camera.position.set(0, (progress) * -20 - 13, 20 + (progress) * 10);
						pong.camera.lookAt(new THREE.Vector3(0, (1 - progress) * -2, 0));	
					}
					if (this.time > this.outTime) {
						this.status = "in";
						this.time = 0;
						pong.p1.reset();
						pong.p2.reset();
						pong.camera.position.set(0, 0, 27);
						pong.camera.lookAt(new THREE.Vector3(0, 0, 0));
						pong.ball.reset();
						pong.dot.uniforms['amount'].value = 1;
						if (pong.bonuse)
							pong.bonus.reset();
						if (pong.bonusParticles)
							pong.bonusParticles.reset();
						if (pong.ballFire)
							pong.ballFire.reset();
						if (pong.impactParticles)
							pong.impactParticles.reset();
						if (pong.ballParticles)
							pong.ballParticles.reset();
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

	setConfig(res) {
		this.p1LeftKey = res.p1Left;
		this.p1RightKey = res.p1Right;
		this.p2LeftKey = res.p2Left;
		this.p2RightKey = res.p2Right;
		this.ball.initSpeed = res.ballSpeed / 100;
		this.ball.resetBall(0, true);
		this.winScore = res.winScore;
		this.bonuses = res.bonuses;
		this.p1.score = res.p1score;
		this.p2.score = res.p2score;
		this.p1infos = res.p1;
		this.p2infos = res.p2;
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
		this.composer.render();
	}

	UpdateShaders() {
		this.vignette.material.uniforms.time = {value: this.totalTime};
		if (this.bonusParticles) {
			this.bonusParticles.particleShader.uniforms.uCenter = {value: this.bonus.getPos()};
			this.bonusParticles.particleShader.uniforms.uType = {value: this.bonus.type};
		}
		if (this.ballParticles)
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
		if (this.bonuse) {
			this.bonus.material.uniforms.uTime = {value: this.totalTime};
			this.bonus.material.uniforms.uType = {value: this.bonus.type};
		}
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
		this.camera.position.x = (1 - smooth) * initCam.p.x + smooth * endCam.p.x;
		this.camera.position.y = (1 - smooth) * initCam.p.y + smooth * endCam.p.y;
		this.camera.position.z = (1 - smooth) * initCam.p.z + smooth * endCam.p.z;
		this.camera.rotation.x = (1 - smooth) * initCam.r.x + smooth * endCam.r.x;
		this.camera.rotation.y = (1 - smooth) * initCam.r.y + smooth * endCam.r.y;
		this.camera.rotation.z = (1 - smooth) * initCam.r.z + smooth * endCam.r.z;
	}
}

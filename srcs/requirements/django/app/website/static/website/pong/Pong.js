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

import PongScene from './PongScene.js';
import PongAssets from './PongAssets.js';
import PongTransi from './PongTransi.js';

import LinearSpline from './LinearSpline.js';
import BallParticles from './BallParticles.js';
import ImpactParticles from './ImpactParticles.js';
import BonusParticles from './BonusParticles.js';
import BallFire from './BallFire.js';
import Bonus from './Bonus.js';
import App from './../state/StateMachine.js';

function add(val, add, max) {
	if (val < 0) val = 0;
	return (Math.min(val + add, max));
}

function sub(val, sub, max) {
	if (val > 0) val = 0;
	return (Math.max(val - sub, -max));
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
			this.transi.toBg(1500)
		})
		sleep(5000).then(() => {
			this.transi.toBlack(1000).then(() => {
				this.transi.toP1Game(1000).then(() => {
					console.log("fin mon gars")
				});
			});
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
			if (keyCode == this.p1LeftKey && !this.p1Left && !this.assets.p1.AI) {
				this.p1Left = true;
				console.log('sdfsdf')
			}
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
			this.WIDTH = window.innerWidth;
			this.HEIGHT = window.innerHeight;
			this.scene.resize();
		}
	}

	initGameVariable() {
		this.WIDTH = window.innerWidth;
		this.HEIGHT = window.innerHeight;
		this.totalTime = 0;
		this.elapsedTime = 0;
		this.lastHit = 0;
		this.exchange = 0;
		this.start = false;
		this.endRound = false;
		this.transiWaitScreen = 0;
		this.waitScreen = true;
		this.winScore = 10;
		this.bg = true;
		this.scaleFactor = 0.25;
	}

	update() {
		this.elapsedTime = performance.now() - this.totalTime;
		this.totalTime = performance.now()

		this.transi.update();
		this.scene.update();
		this.assets.update();
//		this.CheckState();
//		this.UpdateShaders();

		requestAnimationFrame(this.update.bind(this));

/*		if ((!this.assets.p1.bonus.reversed.on && this.p1Left) || (this.assets.p1.bonus.reversed.on && this.p1Right))
			this.p1.subSpeed();
		if ((!this.assets.p1.bonus.reversed.on && this.p1Right) || (this.assets.p1.bonus.reversed.on && this.p1Left))
			this.p1.addSpeed();
		if ((!this.assets.p2.bonus.reversed.on && this.p2Left) || (this.assets.p2.bonus.reversed.on && this.p2Right))
			this.p2.subSpeed();
		if ((!this.assets.p2.bonus.reversed.on && this.p2Right) || (this.assets.p2.bonus.reversed.on && this.p2Left))
			this.p2.addSpeed();
*/	}
}

class PongOld {
	constructor(data) {
		this.InitStates();
		this.Animate();
	//	this.ToState(this.states.ready)
	}

	setConfig(res) {
		this.p1LeftKey = res.p1Left;
		this.p1RightKey = res.p1Right;
		this.p2LeftKey = res.p2Left;
		this.p2RightKey = res.p2Right;
		this.ball.initSpeed = res.ballSpeed / 100;
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
		if (this.assets.bonus) {
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

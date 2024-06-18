// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Pong.js                                            :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/21 13:52:15 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/17 12:16:02 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import * as THREE from 'three';

import PongScene from './PongScene.js';
import PongAssets from './PongAssets.js';
import PongTransi from './PongTransi.js';

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
		this.stateMachine = data.stateMachine;
		this.initKeys();
		this.initEvents();
		this.initGameVariable();
		this.scene = new PongScene({pong: this});
		this.assets = new PongAssets({pong: this});
		this.transi = new PongTransi({pong: this});
//		this.toState(data.state);
//		sleep(5000).then(() => {
//			this.transi.toBlack(1000).then(() => {
//				this.transi.toP1Game(1000).then(() => {
//					console.log("fin mon gars")
//				});
//			});
//		})

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
		this.scaleFactor = 0.75;
		this.bonus = true;
	}

	toState(state) {
		console.log(state)
		if (state == "bg")
			this.transi.to("toBg", 1500);
		else if (state == "p1Game")
			this.transi.to("toP1Game", 1000);
	}

	update() {
		this.elapsedTime = performance.now() - this.totalTime;
		this.totalTime = performance.now()

		this.transi.update();
		this.scene.update();
		this.assets.update();
		
		requestAnimationFrame(this.update.bind(this));
	}

	setConfig(data) {
		console.log(data);
		this.pong.
/*		if (this.transi.transi != "bg") {
			sleep(500).then(() => {
				this.transi.toBlack(1000).then(() => {
					this.preConfig(data);
					this.transi.toP1Game(1000).then(() => {
						this.postConfig(data);
						console.log("lancement de la game")
					});
				});
			});
		} else {
			this.transi.toBlack(1000).then(() => {
				this.preConfig(data);
				this.transi.toP1Game(1000).then(() => {
					this.postConfig(data);
					console.log("lancement de la game")
				});
			});
		}
*/	}

	preConfig(data) {
		this.p1LeftKey = data.p1Left;
		this.p1RightKey = data.p1Right;
		this.p2LeftKey = data.p2Left;
		this.p2RightKey = data.p2Right;
		this.p1Right = false;
		this.p1Left = false;
		this.p1Right = false;
		this.p2Left = false;
		this.p2Right = false;
		this.bonus = data.bonuses;
		this.p1Infos = data.p1;
		this.p2Infos = data.p2;
		this.winScore = data.winScore;
	}

	postConfig(data) {
		this.assets.ball.initSpeed = data.ballSpeed / 100.0;
		this.assets.p1.score = data.p1score;
		this.assets.p2.score = data.p2score;
		if (data.p1.id == -1)
			this.assets.p1.AI = true;
		if (data.p2.id == -1)
			this.assets.p2.AI = true;
		sleep(1000).then(() => {
			this.animateCountdown(5, data);
		})
	}

	animateCountdown(sec, res) {
		let countdown = document.getElementById("countdown");
		if (sec >= 0 && countdown && countdown.innerHTML != sec) {
			countdown.innerHTML = sec;
			countdown.classList.remove("countdown");
			setTimeout(()=>{
				countdown.classList.add("countdown");
			}, 15)
			setTimeout(() => {
				this.animateCountdown(sec - 1, res);
			}, 1000)	
		}
		if (sec == 0 && countdown) {
			setTimeout(()=>{
				this.start = true;
				this.endRound = false;
				if (res.p2.id == -1) {
					if (res.ai == 1)
						this.assets.p2.startAI();
					else if (res.ai == 2)
						console.log("a faire !!!")
				}
			}, 500);
		}
	}
}

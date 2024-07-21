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
		this.initMultiData();
		this.scene = new PongScene({pong: this});
		this.assets = new PongAssets({pong: this});
		this.transi = new PongTransi({pong: this});
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
		this.resetGameInfo();
		//this.resetMultiData();
	}

	resetGameInfo() {
		this.bg = true;
		this.gameInfo = {
			ai: 1,
			ballSpeed: 8,
			bonuses: true,
			p1: {
				id: -1,
				username: ""
			},
			p2: {
				id: -1,
				username: ""
			},
			p1Left: 65,
			p1Right: 68,
			p1score: 0,
			p2Left: 37,
			p2Right: 39,
			p2score: 0,
			winScore: 10,
			p2Local: '',
			//gameType: ?????,
		}
	}

	toState(state) {
		if (state == "bg") {
			this.gameInfo = {
				ai: 1,
				ballSpeed: 8,
				bonuses: true,
				p1: {
					id: -1,
					username: ""
				},
				p2: {
					id: -1,
					username: ""
				},
				p1Left: 65,
				p1Right: 68,
				p1score: 0,
				p2Left: 37,
				p2Right: 39,
				p2score: 0,
				winScore: 10,
				p2Local: '',
				//gameType: ?????,
			}
			this.transi.to("toBg", 1500);
		}
		else if (state == "p1Game")
			this.transi.to("toP1Game", 1000);
	}

	update() {
		this.elapsedTime = performance.now() - this.totalTime;
		this.totalTime = performance.now()

		this.transi.update();
		this.scene.update();
		this.assets.update();

		if (this.isMulti()) {
			if (this.isHost()) {
				//console.log(this.endRound);
				this.sendMultiData();
			}
			//else {

				//}
			// shouldn't this be guest only?
			if (this.multiData['t_impactParticles']){
				setTimeout(() => {
					this.setMultiData('t_impactParticles', false);
				}, 10);
			}
			if (this.multiData['t_ballParticles']){
				setTimeout(() => {
					this.setMultiData('t_ballParticles', false);
				}, 10);
			}
		}

		requestAnimationFrame(this.update.bind(this));
	}

	// -----------------------------
	// -------- Multi utils --------
	// --------------v--------------
	sendMultiData() {
		if (!this.socketIsReady())
			return;
		if (!this.isHost())
			return;
		//if (!this.isHost() && !this.isGuest())
		//	return;

		//// Set data
		if (this.isHost()) {
			var type = 'multiDataHost';
			this.setMultiData('ball_pos', this.assets.ball.ball.position);
			this.setMultiData('ball_vel', this.assets.ball.velocity);
			this.setMultiData('p1_pos', this.assets.p1.bar.position);
			this.setMultiData('p2_pos', this.assets.p2.bar.position);
			this.setMultiData('p1_bonus', this.assets.p1.bonus);
			this.setMultiData('p2_bonus', this.assets.p2.bonus);
			// Bonus
			this.setMultiData('bonus_active', this.assets.bonus.active);
			this.setMultiData('bonus_pos', this.assets.bonus.bonus.position);
			this.setMultiData('bonus_startTime', this.assets.bonus.startTime);
			this.setMultiData('bonus_type', this.assets.bonus.type);
			this.setMultiData('endRound', this.endRound);
		}
		//else if (isGuest()) {
		//	type = 'multiGuestInfo'
		//}
		//else {
		//	return ;
		//}

		// Send data 
		//console.log('Host sending data!');
		this.stateMachine.chatSocket.send(JSON.stringify({
			'type': type,
			//'sender': this.stateMachine.user.username, // tmp
			data: this.multiData,
		}));
	}
	setMultiData(key, value) {
		this.multiData[key] = value;
	}
	handleMultiData(data) {
		if (!this.isMulti())
			return;
		if (!this.isHost())
		{
			this.multiData = data;
			
			// probably will be more complicated than this but...
			//this.endRound = data.endRound;
			// breaks:
			// - impactParticles when getting a point
			// fixes:
			// - ballParticles when not moving
		}
	}
	zeroVec3() {
		return {x: 0, y: 0, z: 0};
	}
	initMultiData() {
		this.multiData = {
			'ball_pos': {x: 0, y: 0, z: 0},
			'ball_vel': {x: 0, y: 0, z: 0},
			//'ballspeed': 0,
			'p1_pos': {x: 0, y: 0, z: 0},
			'p2_pos': {x: 0, y: 0, z: 0},
			't_impactParticles': false,
			't_impactParticles_pos': {x: 0, y: 0, z: 0},
			't_ballParticles': false,
			't_ballParticles_pos': {x: 0, y: 0, z: 0},
			't_resetBall': false,
			'bonus_active': false,
			'bonus_pos': {x: 0, y: 0, z: 0},
			'bonus_startTime': 0,
			'bonus_type': 0,
			't_endRound': false,
			'p1_bonus': {
				big: {on: false, end: false, time: 0.0001},
				small: {on: false, end: false, time: 0.0001},
				line: {on: false, end: false, time: 0.0001},
				frozen: {on: false, end: false, time: 0.0001},
				reversed: {on: false, end: false, time: 0.0001}
			},
			'p2_bonus': {
				big: {on: false, end: false, time: 0.0001},
				small: {on: false, end: false, time: 0.0001},
				line: {on: false, end: false, time: 0.0001},
				frozen: {on: false, end: false, time: 0.0001},
				reversed: {on: false, end: false, time: 0.0001}
			},
			//'p2_bonus': this.assets.p2.bonus,
		}
	}
	resetMultiData() {
		// Only some stuff needs to be reset
		this.setMultiData('t_endRound', false); // might need to be 0, 1 or 2, for updating points accordingly
		this.setMultiData('t_resetBall', false); // might need to be 0, 1 or 2, for updating points accordingly
	}
	isMulti() {
		return (this.gameInfo.gameType == 2);
	}
	isMultiHost() {
		return (this.gameInfo.gameType == 2 && this.isHost());
	}
	isMultiNotHost() {
		return (this.gameInfo.gameType == 2 && !this.isHost());
	}
	isMultiGuest() {
		return (this.gameInfo.gameType == 2 && this.isGuest());
	}
	isMultiNotGuest() {
		return (this.gameInfo.gameType == 2 && this.isGuest());
	}
	isHost() {
		return (this.stateMachine.user.id == this.gameInfo.p1.id);
	}
	isGuest() {
		return (this.stateMachine.user.id == this.gameInfo.p2.id);
	}
	isSpectator() {
		return (!this.isHost() && !this.isGuest());
	}
	socketIsReady() {
		return (this.stateMachine.chatSocket.readyState === WebSocket.OPEN);
	}

	preConfig() {
		this.p1LeftKey = this.gameInfo.p1Left;
		this.p1RightKey = this.gameInfo.p1Right;
		this.p2LeftKey = this.gameInfo.p2Left;
		this.p2RightKey = this.gameInfo.p2Right;
		this.p1Right = false;
		this.p1Left = false;
		this.p1Right = false;
		this.p2Left = false;
		this.p2Right = false;
		this.bonus = this.gameInfo.bonuses;
		this.p1Infos = this.gameInfo.p1;
		this.p2Infos = this.gameInfo.p2;
		this.winScore = this.gameInfo.winScore;
		this.p2Local = this.gameInfo.p2Local;
	}

	postConfig() {
		this.assets.ball.initSpeed = this.gameInfo.ballSpeed / 100.0;
		this.assets.p1.score = this.gameInfo.p1score;
		this.assets.p2.score = this.gameInfo.p2score;
		if (this.gameInfo.p1.id == -1)
			this.assets.p1.AI = true;
		if (this.gameInfo.p2.id == -1 && this.gameInfo.p2Local == "")
			this.assets.p2.AI = true;
		if (this.countTimeout)
			clearTimeout(this.countTimeout)
		if (!(this.gameInfo.p1score >= this.winScore || this.gameInfo.p2score >= this.winScore)) {
			this.countTimeout = setTimeout(() => {
				this.animateCountdown(5);	
			}, 1000)
		}
	}

	animateCountdown(sec) {
		let countdown = document.getElementById("countdown");
		if (sec >= 0 && countdown && countdown.innerHTML != sec) {
			countdown.innerHTML = sec;
			countdown.classList.remove("countdown");
			setTimeout(()=>{
				countdown.classList.add("countdown");
			}, 15)
			this.countTimout = setTimeout(() => {
				this.animateCountdown(sec - 1);
			}, 1000)	
		}
		if (sec == 0 && countdown) {
			setTimeout(()=>{
				this.start = true;
				this.endRound = false;
				if (this.gameInfo.p2.id == -1 && this.gameInfo.p2Local == "") {
					this.assets.p2.startAI();
				}
			}, 500);
		}
	}
}

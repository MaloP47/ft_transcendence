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
		this.initGameVariable();
		this.initMultiData();
		this.initEvents();
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
			if (!this.isMulti()) {
				if (keyCode == this.p2LeftKey && !this.p2Left && !this.assets.p2.AI)
					this.p2Left = true;
				else if (keyCode == this.p2RightKey && !this.p2Right && !this.assets.p2.AI)
					this.p2Right = true;
			}
		}

		function onDocumentKeyUp(event) {
			var keyCode = event.which;
			if (keyCode == this.p1LeftKey && this.p1Left && !this.assets.p1.AI)
				this.p1Left = false;
			else if (keyCode == this.p1RightKey && this.p1Right && !this.assets.p1.AI)
				this.p1Right = false;
			if (!this.isMulti()) {
				if (keyCode == this.p2LeftKey && this.p2Left && !this.assets.p2.AI)
					this.p2Left = false;
				else if (keyCode == this.p2RightKey && this.p2Right && !this.assets.p2.AI)
					this.p2Right = false
			}
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
		this.notConnected = true;
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
			this.transi.to("toBg", 500);
		}
		else if (state == "p1Game")
			this.transi.to("toP1Game", 500);
	}

	update() {
		this.elapsedTime = performance.now() - this.totalTime;
		this.totalTime = performance.now();

		//console.log('transi -> ' + this.transi.transi);
		//if (this.isMultiPlayer() && !this.isFinished()) {
		if (this.isMultiPlayer()) {
			this.updateMulti();
		} else {
			this.transi.update();
			this.scene.update();
			this.assets.update();
		}

		requestAnimationFrame(this.update.bind(this));
	}
	updateMulti() {
		if (!this.isFinished())
			this.handlePause();

		this.transi.update();
		this.scene.update();
		this.assets.update();

		this.sendMultiData();
		this.resetMultiData();
	}

	handlePause() {
		let countdown = document.getElementById("countdown");
		if (!countdown)
			return;
		if (this.multiData.enemy_connected) {
			this.multiData.enemy_connected_last = performance.now();
			if (this.isHost()) {
				//let sec = 5;
				//this.animateCountdown(sec);
				//setTimeout(()=>{ this.start = true; }, sec * 1000);
				this.start = true;
			}
			countdown.innerHTML = "";
		}
		if (!this.multiData.enemy_connected && performance.now() - this.multiData.enemy_connected_last >= 300) {
			if (this.isHost()) {
				this.start = false;
			}
			countdown.style.fontSize = "4rem";
			if (this.isHost()) {
				countdown.innerHTML = "Waiting for " + this.gameInfo.p2.username + "...";
			} else {
				countdown.innerHTML = "Waiting for " + this.gameInfo.p1.username + "...";
			}
		}
	}
	//handlePause() {
	//	let countdown = document.getElementById("countdown");
	//	if (!countdown)
	//		return;
	//	if (this.multiData.enemy_connected) {
	//		this.multiData.enemy_connected_last = performance.now();
	//		if (this.isHost()) {
	//			//let count = 5;
	//			//this.animateCountdown(count);
	//			//	setTimeout(() => { this.start = true; }, count * 1000);
	//			this.start = true;
	//		}
	//		//if (this.isGuest() && this.notConnected) {
	//		//	countdown.innerHTML = "";
	//		//}
	//		//this.notConnected = false;
	//	}
	//	if (!this.multiData.enemy_connected && performance.now() - this.multiData.enemy_connected_last >= 300) {
	//		if (this.isHost()) {
	//			this.start = false;
	//		//	this.endRound = true;
	//		}
	//		//setTimeout(()=>{
	//			//if (!countdown)
	//			//	return ;
	//			countdown.style.fontSize = "4rem";
	//			if (this.isHost()) {
	//				countdown.innerHTML = "Waiting for " + this.gameInfo.p2.username + "...";
	//				//if (this.notConnected == false) {
	//				//}
	//			} else {
	//				countdown.innerHTML = "Waiting for " + this.gameInfo.p1.username + "...";
	//				//if (this.notConnected == false) {
	//				//}
	//			}
	//			//this.notConnected = true;
	//		//}, 30);
	//	}
	//}

	// Utils
	isFinished() { return (this.assets.p1.score >= this.winScore || this.assets.p2.score >= this.winScore); }
	// -----------------------------
	// -------- Multi utils --------
	// --------------v--------------
	sendMultiData() {
		if (!this.socketIsReady())
			return;
		if (!this.isHost() && !this.isGuest())
			return;

		// Set data
		if (this.isHost()) {
			var type = 'multiDataHost';
			// Ball
			this.setMultiData('ball_pos', this.assets.ball.ball.position);
			this.setMultiData('ball_vel', this.assets.ball.velocity);
			this.setMultiData('p1_pos', this.assets.p1.bar.position);
			this.setMultiData('p2_pos', this.assets.p2.bar.position);
			// Score
			this.setMultiData('p1_score', this.assets.p1.score);
			this.setMultiData('p2_score', this.assets.p2.score);
			this.setMultiData('winScore', this.winScore);
			// Bonus
			this.setMultiData('p1_bonus', this.assets.p1.bonus);
			this.setMultiData('p2_bonus', this.assets.p2.bonus);
			this.setMultiData('bonus_active', this.assets.bonus.active);
			this.setMultiData('bonus_pos', this.assets.bonus.bonus.position);
			this.setMultiData('bonus_startTime', this.assets.bonus.startTime);
			this.setMultiData('bonus_type', this.assets.bonus.type);
			this.setMultiData('endRound', this.endRound);
			// Other
			this.setMultiData('start', this.start);
			this.setMultiData('game_id', this.gameInfo.game_id);
			this.setMultiData('enemy_connected', true);
		}
		else if (this.isGuest()) {
			//console.log('Sending guest inputs');
			var type = 'multiDataGuest';

			// Guest inputs
			this.setMultiData('p2_left', this.p1Left);
			this.setMultiData('p2_right', this.p1Right);
			this.setMultiData('enemy_connected', true);
		}

		// Send data 
		this.stateMachine.chatSocket.send(JSON.stringify({
			'type': type,
			//'sender': this.stateMachine.user.username,
			data: this.multiData,
		}));
	}
	setMultiData(key, value) {
		this.multiData[key] = value;
	}
	handleMultiData(type, data) {
		if (!this.isMulti())
			return;

		// IMP: don't set multiData during this,
		// only at the beggining of a render loop

		if (type == 'multiDataGuest' && this.isHost()) {
			// Guest inputs
			this.p2Left = data.p2_left;
			this.p2Right = data.p2_right;
			this.multiData.enemy_connected = data.enemy_connected;
		}
		else if (type == 'multiDataHost' && this.isGuest()) {
			this.multiData = data;
			
			// Score
			this.assets.p1.score = data.p1_score;
			this.assets.p2.score = data.p2_score;
			this.winScore = data.winScore;
			// Other
			// don't need endRound YET but KEEP IT
			//this.endRound = data.endRound;
			this.start = data.start;
			//if (data.t_countdown != -1)
			//	this.animateCountdownMulti();
		}
	}
	zeroVec3() {
		return {x: 0, y: 0, z: 0};
	}
	initMultiData() {
		this.multiData = {
			// Ball
			'ball_pos': {x: 0, y: 0, z: 0},
			'ball_vel': {x: 0, y: 0, z: 0},
			'p1_pos': {x: 0, y: 0, z: 0},
			'p2_pos': {x: 0, y: 0, z: 0},
			// Particles
			't_impactParticles': false,
			't_impactParticles_pos': {x: 0, y: 0, z: 0},
			't_ballParticles': false,
			't_ballParticles_pos': {x: 0, y: 0, z: 0},
			't_ballFire': false,
			't_ballFire_pos': {x: 0, y: 0, z: 0},
			// Score
			't_resetBall': false,
			't_resetBall_player': 0, // not used yet
			'p1_score': 0,
			'p2_score': 0,
			'winScore': 0,
			// Bonuses
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
			// Other
			'start': false,
			't_countdown': -1,
			// Inputs
			'p2_left': false,
			'p2_right': false,
			'game_id': -1,
			// Connection detection
			//'p1_connected': false,
			'enemy_connected': false,
			'enemy_connected_last': 0,
		}
	}
	resetMultiData() {
		// Only some stuff needs to be reset
		this.setMultiData('t_endRound', false);
		this.setMultiData('t_resetBall', false);
		this.setMultiData('t_countdown', -1); // or timer?
		this.setMultiData('enemy_connected', false); // or timer?

		// Time sensitive
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
		if (this.multiData['t_ballFire']){
			setTimeout(() => {
				this.setMultiData('t_ballFire', false);
			}, 10);
		}
		
		// connection Detection (will only work for remote right now)
		//if (this.multiData['enemy_connected']) {
		//	setTimeout(() => {
		//		this.setMultiData('enemy_connected', false);
		//	}, 300);
		//}
	}
	isMulti() { return (this.gameInfo.gameType == 2); }
	isMultiHost() { return (this.isMulti() && this.isHost()); }
	isMultiNotHost() { return (this.isMulti() && !this.isHost()); }
	isMultiGuest() { return (this.isMulti() && this.isGuest()); }
	isMultiNotGuest() { return (this.isMulti() && this.isGuest()); }
	isMultiPlayer() { return (this.isMulti() && (this.isHost() || this.isGuest())); }
	isHost() { return (this.stateMachine.user.id == this.gameInfo.p1.id); }
	isGuest() { return (this.stateMachine.user.id == this.gameInfo.p2.id); }
	socketIsReady() { return (this.stateMachine.chatSocket.readyState === WebSocket.OPEN); }

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

		this.start = true; // timer
		this.endRound = false;
		if (this.gameInfo.p2.id == -1 && this.gameInfo.p2Local == "" && this.gameInfo.gameType < 1) {
			this.assets.p2.startAI();
		}
	}

	//animateCountdown(sec) {
	//	if (sec < 0)
	//		return ;
	//	let countdown = document.getElementById("countdown");
	//	if (!countdown)
	//		return ;

	//	//this.countTimeout = true;
	//	//clearTimeout(timeoutID);
	//	for (let secs = 0; secs <= sec; secs++) {

	//		setTimeout(()=>{
	//			countdown.innerHTML = secs;
	//			this.setMultiData('t_countdown', secs);
	//			if (secs == 0)
	//				setTimeout(() => { countdown.innerHTML = ""; }, 200);
	//		}, (sec - secs) * 1000);
	//	}
	//}
	//animateCountdownMulti() {
	//	let countdown = document.getElementById("countdown");

	//	if (!countdown)
	//		return ;
	//	countdown.innerHTML = this.multiData.t_countdown;
	//	countdown.style.fontSize = "4rem";
	//	if (secs == 0)
	//		setTimeout(()=>{ countdown.innerHTML = ""; }, 200)
	//	
	//}
}

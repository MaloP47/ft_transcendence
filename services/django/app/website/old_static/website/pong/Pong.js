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
		this.rd = {};

		//if (this.isRemote()) {
		//	//console.log('coucou');
		//	//console.log(this.stateMachine.pongSocket);
		//	socketIsReady('pongSocket').then(() => {
		//		console.log("Done waiting for pongSocket.");
		//		//requestAnimationFrame(this.update.bind(this));
		//	});
		//}
		//else {
		//	console.log('salut');
		//	requestAnimationFrame(this.update.bind(this));
		//}
		this.update(); // bug caused by update running without a websocket connection established, probably
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

	// Remote Utils
	isRemote() {
		return (this.gameInfo.gameType == 2); // might not be safe to use everywhere, not sure ai games have gameInfo or gameType
	}
	isRemoteNotHost() {
		return (this.gameInfo.gameType == 2 && !this.isHost());
	}
	isHost() { // check if that returns boolean
		return (this.stateMachine.user.id == this.gameInfo.p1.id);
	}
	isGuest() {
		return (this.stateMachine.user.id == this.gameInfo.p2.id);
	}
	isSpectator() {
		return (!this.isHost() && !this.isGuest());
	}
	setRemoteDataHost() {
		this.setRemoteData('type', 'gameInfoBroadcast');
		this.setRemoteData('ballpos', this.assets.ball.ball.position);
		this.setRemoteData('ballvel', this.assets.ball.velocity);
		this.setRemoteData('p1pos', this.assets.p1.bar.position);
		this.setRemoteData('p2pos', this.assets.p2.bar.position);
	}
	//setRemoteDataGuest() {
	//	// inputs
	//}
	setRemoteData(key, value) {
		this.rd[key] = value;
	}
	clearRemoteData() {
		this.rd = {};
	}
	sendRemoteData() { // args later for send guest inputs
		if (this.stateMachine.socketIsReady('pongSocket'))
			this.stateMachine.pongSocket.send(JSON.stringify(this.rd));
	}

	
	// NOA: will edit this now to work for multiplayer, fix ai later
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
			gameType: -1, // NOT SURE IF SAFE
		}
	}

	toState(state) {
		if (state == "bg") {
			this.stateMachine.socketReset('pongSocket');
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
				gameType: -1, // ASK GUILLAUME
			}
			this.transi.to("toBg", 1500);
		}
		else if (state == "p1Game")
			this.transi.to("toP1Game", 1000);
	}

	update() {
		this.elapsedTime = performance.now() - this.totalTime;
		this.totalTime = performance.now()

		if (!this.isRemote()) { // Local game logic
			this.transi.update();
			this.scene.update();
			this.assets.update();
		}
		else { // Remote game logic
			if (this.isHost()) {
				// Guest inputs will have an impact here
				// so check stateMachine.js for pongSocket.onmessage
				this.transi.update();
				this.scene.update();
				this.assets.update();
				this.setRemoteDataHost();
				this.sendRemoteData();
				this.clearRemoteData();
			}
			//else if (this.isGuest())
			//{
				// broadcast inputs?
				// or is that in onmessage (don't think so, think about it later)?
			//}
			else {
				//console.log('level 1: Pong.js');
				//console.log(this.rd);
				this.transi.update();
				this.scene.update();
				this.assets.update();
			}

		}
		
		requestAnimationFrame(this.update.bind(this));
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
		this.gameType = this.gameInfo.gameType;
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
		// tweak this for multiplayer
		// try to make it a for loop instead of recursive but later
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

import * as THREE from 'three';

function add(val, add, max) {
	if (val < 0) val = 0;
	return (Math.min(val + add, max));
}

function sub(val, sub, max) {
	if (val > 0) val = 0;
	return (Math.max(val - sub, -max));
}

export default class Player {
	constructor(params) {
		// PARAMS THAT CAN BE UPDATED WITH BONUSES
		this.speed = 0.0;
		this.drag = 1;
		this.speedInc = 0.03;
		this.pong = params.pong;
		this.maxPos = 6;
		this.geometry = new THREE.BoxGeometry(2.0, 0.2, 0.5);
		this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this.bar = new THREE.Mesh(this.geometry, this.material);
		if (params.player == 1) {
			this.player = 1;
			this.bar.position.y = -9.2;
		} else {
			this.player = 2;
			this.bar.position.y = 9.2;
		}
		this.score = 0;
		this.prevPos = this.bar.position.clone();
		this.currentPos = this.bar.position.clone();
		this.velcity = new THREE.Vector3(0, 0, 0);
		this.bonus = {
			big: {on: false, end: false, time: 0.0001},
			small: {on: false, end: false, time: 0.0001},
			line: {on: false, end: false, time: 0.0001},
			frozen: {on: false, end: false, time: 0.0001},
			reversed: {on: false, end: false, time: 0.0001}
		}
		this.AI = false;
	}

	UpdateBonus(bonus, timeRatio, max) {
		if (bonus.on) {
			if (!bonus.end)
				bonus.time = Math.min(bonus.time + this.pong.elapsedTime / timeRatio, max);
			else {
				bonus.time -= this.pong.elapsedTime / 100;
				if (bonus.time <= 0) {
					bonus.on = false;
					bonus.end = false;
				}
			}
		} else 
			bonus.time = 0.0001;
	}

	Update() {
		this.UpdateBonus(this.bonus.big, 200, 1);
		this.UpdateBonus(this.bonus.small, 200, 1);
		this.UpdateBonus(this.bonus.frozen, 200, 1);
		this.UpdateBonus(this.bonus.line, 100, 10);
		this.UpdateBonus(this.bonus.reversed, 200, 1);
		const maxPos = this.maxPos - this.bonus.big.time + this.bonus.small.time / 2;
		if (this.player == 1) {
			this.LEFT = this.pong.p1Left;
			this.RIGHT = this.pong.p1Right;
		} else {
			this.LEFT = this.pong.p2Left;
			this.RIGHT = this.pong.p2Right;
		}
		if (!this.LEFT && !this.RIGHT) {
			if (this.bar.position.x + this.speed * this.pong.elapsedTime / 12 > maxPos && Math.abs(this.speed) > 0.1) {
				this.bar.position.x = maxPos;
				this.speed = -this.speed / 1.75;
			} else if (this.bar.position.x + this.speed * this.pong.elapsedTime / 12 < -maxPos && Math.abs(this.speed) > 0.1) {
				this.bar.position.x = -maxPos;
				this.speed = -this.speed / 1.75;
			}
			this.bar.position.x = Math.min(maxPos, Math.max(-maxPos, this.bar.position.x + this.speed * this.pong.elapsedTime / 12));
		} else {
			this.bar.position.x = Math.min(maxPos, Math.max(-maxPos, this.bar.position.x + this.speed * this.pong.elapsedTime / 12));
			if (this.bar.position.x <= -maxPos || this.bar.position.x >= maxPos) {
				this.speed = 0;
			}
		}
		this.updateSpeed();
		this.prevPos = this.currentPos.clone();
		this.currentPos = this.bar.position.clone();
		this.velcity = this.prevPos.clone();
		this.velcity.sub(this.currentPos);
	}
	
	getPos() { return(this.bar.position.clone()); }
	getSpeed() { return(this.speed); }
	getVelocity() { return(this.velcity.clone()); }
	getDrag() { return(this.drag); }
	getAddSpeed() { return(this._addSpeed); }
	addSpeed() { this.speed = add(this.speed, this.speedInc * this.pong.elapsedTime / 12, 0.3); }
	subSpeed() { this.speed = sub(this.speed, this.speedInc * this.pong.elapsedTime / 12, 0.3); }
	updateSpeed() {
		if (Math.abs(this.speed) > 0.005)
			this.speed /= (1 + ((this.drag - (this.bonus.frozen.time * 0.9))) * this.pong.elapsedTime / 50);
		else
			this.speed = 0;
	}

	reset() {
		this.setAI(false);
		this.bar.position.x = 0;
		this.bonus = {
			big: {on: false, end: false, time: 0.0001},
			small: {on: false, end: false, time: 0.0001},
			line: {on: false, end: false, time: 0.0001},
			frozen: {on: false, end: false, time: 0.0001},
			reversed: {on: false, end: false, time: 0.0001}
		}
		this.score = 0;
		this.prevPos = this.bar.position.clone();
		this.currentPos = this.bar.position.clone();
		this.velcity = new THREE.Vector3(0, 0, 0);
		this.speed = 0.0;
	}
	
	setAI(value) {
		if (this.AI)
			clearTimeout(this.brainTimeout);
		this.AI = value;
	}
	
	startAI() {
		if (!this.AI)
			return ;
		this.brainTimeout = setTimeout(this.startAI.bind(this), 1000);
		this.basicAI();
	}

	stopAI() {
		clearTimeout(this.brainTimeout);
	}

	basicAI() {
		if (this.bonus.line.on)
			return ;
		const ball = this.pong.ball;
		let pos = ball.getPos();
		let vel = ball.getVelocity();
		let speed = ball.getSpeed();
		if (this.player == 1 && vel.y > 0)
			return ;
		if (this.player == 2 && vel.y < 0)
			return ;
		var target = this.getTargetInfo({x: pos.x, y: pos.y}, {x: pos.x + vel.x, y: pos.y + vel.y});
		var travelDist = target.pos - this.bar.position.x;
		var coef = 1;
		if (this.bonus.reversed.on)
			coef = -1;
		var mult = 1;
		if (this.bonus.frozen.on)
			mult = 0.2;
		if (this.player == 1) {
			if (travelDist < 0 && !this.bonus.reversed.on || travelDist > 0 && this.bonus.reversed.on) {
				this.pong.p1Left = true;
				setTimeout(() => {this.pong.p1Left = false}, coef * -(travelDist + (Math.random() - 0.5) * 2) / 0.26 * 12 * mult);
			} else {
				this.pong.p1Right = true;
				setTimeout(() => {this.pong.p1Right = false}, coef * (travelDist + (Math.random() - 0.5) * 2) / 0.26 * 12 * mult);
			}
		} else {
			if (travelDist < 0 && !this.bonus.reversed.on || travelDist > 0 && this.bonus.reversed.on) {
				this.pong.p2Left = true;
				setTimeout(() => {this.pong.p2Left = false}, coef * -(travelDist + (Math.random() - 0.5) * 2) / 0.26 * 12 * mult);
			} else {
				this.pong.p2Right = true;
				setTimeout(() => {this.pong.p2Right = false}, coef * (travelDist + (Math.random() - 0.5) * 2) / 0.26 * 12 * mult);
			}
		}
	}

	getTargetInfo(start1, start2) {
		var end1 = {x: 0, y: -9};
		var end2 = {x: 1, y: -9};
		if (this.player == 2) {
			end1.y = 9;
			end2.y = 9;
		}
		var denom = (start1.x - start2.x) * (end1.y - end2.y) - (start1.y - start2.y) * (end1.x - end2.x);
		if (denom == 0)
			return ({pos:0, time: this.pong.totalTime + 1000});
		var x = ((start1.x * start2.y - start1.y * start2.x) * (end1.x - end2.x) - (start1.x - start2.x) * (end1.x * end2.y - end1.y * end2.x)) / denom;
		var travel = new THREE.Vector2(x - start1.x, end1.y - start1.y);
		while (x < -7 || x > 7) {
			if (x > 0)
				x = 14 - x;
			else
				x = -14 - x;
		}
		var time = travel.length() / this.pong.ball.getSpeed() * 10;
		return ({pos: x, time: time});
	}
}

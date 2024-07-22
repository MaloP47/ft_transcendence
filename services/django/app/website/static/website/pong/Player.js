// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Player.js                                          :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/06/20 14:15:18 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/20 15:10:41 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

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
	constructor(data) {
		this.speed = 0.0;
		this.drag = 1;
		this.speedInc = 0.02;
		this.pong = data.pong;
		this.maxPos = 6;
		this.geometry = new THREE.BoxGeometry(2.0, 0.2, 0.5);
		this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this.bar = new THREE.Mesh(this.geometry, this.material);
		if (data.player == 1) {
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

	updateBonus(bonus, timeRatio, max) {
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

	update() {
		// Multi
		if (this.pong.isMultiNotHost())
			return this.updateMulti();

		const maxPos = this.maxPos - this.bonus.big.time + this.bonus.small.time / 2;

		if (this.player == 1) {
			this.LEFT = this.pong.p1Left;
			this.RIGHT = this.pong.p1Right;
		} else {
			this.LEFT = this.pong.p2Left;
			this.RIGHT = this.pong.p2Right;
		}
		if ((!this.bonus.reversed.on && this.LEFT) || (this.bonus.reversed.on && this.RIGHT))
			this.subSpeed();
		if ((!this.bonus.reversed.on && this.RIGHT) || (this.bonus.reversed.on && this.LEFT))
			this.addSpeed();
		if (!this.LEFT && !this.RIGHT) {
			if (this.bar.position.x + this.speed > maxPos && Math.abs(this.speed) > 0.1) {
				this.bar.position.x = maxPos;
				this.speed = -this.speed / 2.25;
			} else if (this.bar.position.x + this.speed < -maxPos && Math.abs(this.speed) > 0.1) {
				this.bar.position.x = -maxPos;
				this.speed = -this.speed / 2.25;
			}
			this.bar.position.x = Math.min(maxPos, Math.max(-maxPos, this.bar.position.x + this.speed * this.pong.elapsedTime / 30));
			this.updateSpeed();
		} else {
			this.bar.position.x = Math.min(maxPos, Math.max(-maxPos, this.bar.position.x + this.speed * this.pong.elapsedTime / 30));
			if (this.bar.position.x <= -maxPos || this.bar.position.x >= maxPos) {
				this.speed = 0;
			}
		}
		this.prevPos = this.currentPos.clone();
		this.currentPos = this.bar.position.clone();
		this.velcity = this.prevPos.clone();
		this.velcity.sub(this.currentPos);

		this.updateBonus(this.bonus.big, 200, 1);
		this.updateBonus(this.bonus.small, 200, 1);
		this.updateBonus(this.bonus.frozen, 200, 1);
		this.updateBonus(this.bonus.line, 100, 10);
		this.updateBonus(this.bonus.reversed, 200, 1);
	}
	updateMulti() {
		if (this.player == 1) {
			this.bar.position.x = this.pong.multiData.p1_pos.x;
			this.bar.position.y = this.pong.multiData.p1_pos.y;
			this.currentPos = this.bar.position.clone(); 
			this.bonus = this.pong.multiData.p1_bonus;
		} else {
			this.bar.position.x = this.pong.multiData.p2_pos.x;
			this.bar.position.y = this.pong.multiData.p2_pos.y;
			this.currentPos = this.bar.position.clone(); 
			this.bonus = this.pong.multiData.p2_bonus;
		}

	//	console.log("guest bonuses ->");
	//	console.log(this.bonus);

		// probably dont need to call that
		//this.updateBonus(this.bonus.big, 200, 1);
		//this.updateBonus(this.bonus.small, 200, 1);
		//this.updateBonus(this.bonus.frozen, 200, 1);
		//this.updateBonus(this.bonus.line, 100, 10);
		//this.updateBonus(this.bonus.reversed, 200, 1);
	}
	
	getPos() { return(this.bar.position.clone()); }
	getSpeed() { return(this.speed); }
	getVelocity() { return(this.velcity.clone()); }
	getDrag() { return(this.drag); }
	getAddSpeed() { return(this._addSpeed); }
	addSpeed() { this.speed = add(this.speed, this.speedInc * this.pong.elapsedTime / 5, 0.6); }
	subSpeed() { this.speed = sub(this.speed, this.speedInc * this.pong.elapsedTime / 5, 0.6); }
	updateSpeed() {
		if (Math.abs(this.speed) > 0.005)
			this.speed /= (1 + ((this.drag - (this.bonus.frozen.time * 0.9))) * this.pong.elapsedTime / 150);
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
		if (this.pong.gameInfo.ai == 2)
			setTimeout(this.betterAI.bind(this), 10);
		else
			setTimeout(this.basicAI.bind(this), 10);
	}

	stopAI() {
		clearTimeout(this.brainTimeout);
	}

	basicAI() {
		if (this.bonus.line.on)
			return ;
		const ball = this.pong.assets.ball;
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
	
	betterAI() {
		const ball = this.pong.assets.ball;
		let pos = ball.getPos();
		let vel = ball.getVelocity();
		let speed = ball.getSpeed();
		var travelDist = 0;
		var coef = 1;
		var mult = 1;
		if (this.player == 1 && vel.y > 0) {
			if (this.pong.exchange == 0)
				return ;
			travelDist = -this.bar.position.x
			if (this.bonus.reversed.on)
				coef = -1;
			if (this.bonus.frozen.on)
				mult = 0.3;
			if (travelDist < 0 && !this.bonus.reversed.on || travelDist > 0 && this.bonus.reversed.on) {
				this.pong.p1Left = true;
				setTimeout(() => {this.pong.p1Left = false}, coef * -travelDist / 0.26 * 8.65 * mult);
			} else {
				this.pong.p1Right = true;
				setTimeout(() => {this.pong.p1Right = false}, coef * travelDist / 0.26 * 8.65 * mult);
			}
			return ;
		}
		if (this.player == 2 && vel.y < 0) {
			if (this.pong.exchange == 0)
				return ;
			travelDist = -this.bar.position.x
			if (this.bonus.reversed.on)
				coef = -1;
			if (this.bonus.frozen.on)
				mult = 0.3;
			if (travelDist < 0 && !this.bonus.reversed.on || travelDist > 0 && this.bonus.reversed.on) {
				this.pong.p2Left = true;
				setTimeout(() => {this.pong.p2Left = false}, coef * -travelDist / 0.26 * 8.65 * mult);
			} else {
				this.pong.p2Right = true;
				setTimeout(() => {this.pong.p2Right = false}, coef * travelDist / 0.26 * 8.65 * mult);
			}
			return ;
		}
		var target = this.getTargetInfo({x: pos.x, y: pos.y}, {x: pos.x + vel.x, y: pos.y + vel.y});
		travelDist = target.pos - this.bar.position.x;
		if (this.bonus.reversed.on)
			coef = -1;
		if (this.bonus.frozen.on)
			mult = 0.3;
		if (this.player == 1) {
			if (travelDist < 0 && !this.bonus.reversed.on || travelDist > 0 && this.bonus.reversed.on) {
				this.pong.p1Left = true;
				setTimeout(() => {this.pong.p1Left = false}, coef * -travelDist / 0.26 * 8.65 * mult);
			} else {
				this.pong.p1Right = true;
				setTimeout(() => {this.pong.p1Right = false}, coef * travelDist / 0.26 * 8.65 * mult);
			}
		} else {
			if (travelDist < 0 && !this.bonus.reversed.on || travelDist > 0 && this.bonus.reversed.on) {
				this.pong.p2Left = true;
				setTimeout(() => {this.pong.p2Left = false}, coef * -travelDist / 0.26 * 8.65 * mult);
			} else {
				this.pong.p2Right = true;
				setTimeout(() => {this.pong.p2Right = false}, coef * travelDist / 0.26 * 8.65 * mult);
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
		var time = travel.length() / this.pong.assets.ball.getSpeed() * 10;
		return ({pos: x, time: time});
	}
}

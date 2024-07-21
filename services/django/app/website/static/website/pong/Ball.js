// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Ball.js                                            :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/24 13:13:55 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/20 15:21:28 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import * as THREE from 'three';

function distSq(a, b) {
	return ((Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)));
}

export default class Ball {
	constructor(data) {
		this.pong = data.pong;
		this.geometry = new THREE.IcosahedronGeometry(0.2, 3);
		this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
		this.ball = new THREE.Mesh(this.geometry, this.material);
		this.pong.scene.add(this.ball);

		if (this.pong.gameInfo)
			this.initSpeed = this.pong.gameInfo.ballSpeed / 100.0;
		else
			this.initSpeed = 0.08;
		this.speed = this.initSpeed;

		this.prevPos = this.ball.position.clone();
		this.currentPos = this.ball.position.clone();
		this.initAngle = Math.random() * 90;
		this.velocity = new THREE.Vector3(0, 0, 0);
		this.velocity.x = Math.sin((this.initAngle - 45) * Math.PI / 180);
		this.velocity.y = Math.cos((this.initAngle - 45) * Math.PI / 180);

		this.maxXPos = 6.8;
		this.maxYPos = 10.5;
		this.maxPlayerPos = 9;
	}

	update() {
		if (this.pong.endRound) {
			return ;
		}

		// Multi
		if (this.pong.isMultiNotHost())
			return this.updateMulti();

		// Sides collisions
		if (this.ball.position.x + this.velocity.x * this.speed * this.pong.elapsedTime / 10 > this.maxXPos
				|| this.ball.position.x + this.velocity.x * this.speed * this.pong.elapsedTime / 10 < -this.maxXPos){
			this.velocity.x = -this.velocity.x;
			if (this.pong.assets.impactParticles)
				this.pong.assets.impactParticles.AddParticles();
		}
		// Top - Bottom collisions
		if (this.ball.position.y + this.velocity.y * this.speed * this.pong.elapsedTime / 10 > this.maxYPos) {
			if (this.pong.assets.impactParticles)
				this.pong.assets.impactParticles.AddParticles();
			this.resetBall(1);
		}
		if (this.ball.position.y + this.velocity.y * this.speed * this.pong.elapsedTime / 10 < -this.maxYPos) {
			if (this.pong.assets.impactParticles)
				this.pong.assets.impactParticles.AddParticles();
			this.resetBall(2);
		}
		// Line Bonus collisions
		if (this.pong.assets.p1.bonus.line.on && this.ball.position.y + this.velocity.y * this.speed * this.pong.elapsedTime / 10 < -8.5) {
			this.velocity.y = -this.velocity.y;
			if (this.pong.assets.impactParticles)
				this.pong.assets.impactParticles.AddParticles();
		}
		if (this.pong.assets.p2.bonus.line.on && this.ball.position.y + this.velocity.y * this.speed * this.pong.elapsedTime / 10 > 8.5) {
			this.velocity.y = -this.velocity.y;
			if (this.pong.assets.impactParticles)
				this.pong.assets.impactParticles.AddParticles();
		}
		// Players collisions
		if (this.ball.position.y + this.velocity.y * this.speed * this.pong.elapsedTime / 10 < -this.maxPlayerPos)
			this.checkCollisionPlayer(1);
		if (this.ball.position.y + this.velocity.y * this.speed * this.pong.elapsedTime / 10 > this.maxPlayerPos)
			this.checkCollisionPlayer(2);
		// Bonus attractor
		if (this.pong.assets.bonus && this.pong.assets.bonus.isActive()) {
			let distanceSq = distSq(this.getPos(), this.pong.assets.bonus.getPos());
			if (distanceSq < 0.3) {
				this.pong.assets.bonus.setActive(false);
			} else if (distanceSq < 5) {
				this.velocity.add(this.pong.assets.bonus.getPos().sub(this.getPos()).normalize().divideScalar(distanceSq * 4));
				this.velocity.normalize();
			}
		}
		this.ball.position.x += this.velocity.x * this.speed * this.pong.elapsedTime / 10;
		this.ball.position.y += this.velocity.y * this.speed * this.pong.elapsedTime / 10;
		this.prevPos = this.currentPos.clone();
		this.currentPos = this.ball.position.clone();
	}
	updateMulti() {
		//console.log(this.pong.multiData);

		//if (!this.pong.multiData.trigger_resetBall &&
		//	this.pong.multiData.trigger_impactParticles)
		//	this.pong.assets.impactParticles.AddParticles();

		if (this.pong.multiData.trigger_impactParticles)
			this.pong.assets.impactParticles.AddParticles();
		this.velocity.x = this.pong.multiData.ball_vel.x;
		this.velocity.y = this.pong.multiData.ball_vel.y;
		this.ball.position.x = this.pong.multiData.ball_pos.x;
		this.ball.position.y = this.pong.multiData.ball_pos.y;
		//this.ball.speed = this.pong.multiData.ballspeed;
		//if (this.pong.multiData.trigger_resetBall &&
		//	this.pong.multiData.trigger_impactParticles)
		//	this.pong.assets.impactParticles.AddParticles();

		this.prevPos = this.currentPos.clone(); // comment this
		this.currentPos = this.ball.position.clone();
	}

	reset() {
		clearTimeout(this.nextTimeout);
		this.pong.exchange = 0;
		this.ball.position.x = 0;
		this.ball.position.y = 0;
		this.prevPos = this.ball.position.clone();
		this.currentPos = this.ball.position.clone();
		this.initAngle = Math.random() * 90;
		this.velocity = new THREE.Vector3(0, 0, 0);
		this.velocity.x = Math.sin((this.initAngle - 45) * Math.PI / 180);
		this.velocity.y = Math.cos((this.initAngle - 45) * Math.PI / 180);
	}

	resetBall(player) {

		if (this.pong.isMultiHost())
			this.pong.setMultiData('trigger_resetBall', true);
		//if (this.pong.isMultiNoHost())
		//	return this.resetBallMulti();

		this.pong.endRound = true;
		if (this.pong.assets.bonus)
			this.pong.assets.bonus.setActive(false);
		this.pong.exchange = 0;
		this.ball.position.y = 0;
		this.ball.position.x = 0;
		if (player == 1) {
			if (!this.pong.bg) {
				this.pong.assets.p1.score += 1;
				this.pong.stateMachine.getApiResponseJson("/api/game/save/",
					{
						id: this.pong.game_id,
						p1: this.pong.assets.p1.score,
						p2: this.pong.assets.p2.score
					})
				let p1score = document.getElementById("p1score");
				if (p1score)
					p1score.innerHTML = this.pong.assets.p1.score;
			}
			this.ball.position.y = -0.5;
		} else if (player == 2) {
			if (!this.pong.bg) {
				this.pong.assets.p2.score += 1;
				this.pong.stateMachine.getApiResponseJson("/api/game/save/",
					{
						id: this.pong.game_id,
						p1: this.pong.assets.p1.score,
						p2: this.pong.assets.p2.score
					})
				let p2score = document.getElementById("p2score");
				if (p2score)
					p2score.innerHTML = this.pong.assets.p2.score;
			}
			this.ball.position.y = 0.5;
		}
		if (this.pong.assets.bonus)
			clearTimeout(this.pong.assets.bonus.nextTimeout);
		if (!this.pong.bg && (this.pong.assets.p1.score >= this.pong.winScore || this.pong.assets.p2.score >= this.pong.winScore)) {
			let endDiv = document.getElementById("countdown");
			if (endDiv) {
				let p1 = "A.I.";
				if (!this.pong.assets.p1.AI)
					p1 = this.pong.p1Infos.username;
				let p2 = "A.I.";
				if (!this.pong.assets.p2.AI && this.pong.p2Local == '')
					p2 = this.pong.p2Infos.username;
				else if (this.pong.p2Local != '')
					p2 = this.pong.p2Local;
				let gameVs = "<span class='fs-2 text-light-emphasis'>" + p1 + " vs " + p2 + "</span>";
				if (this.pong.assets.p1.score > this.pong.assets.p2.score) {
					endDiv.innerHTML = gameVs + "<p style='font-size:5rem; margin-top: -30px'>" + p1 + " wins this game !</p>"
				} else {
					endDiv.innerHTML = gameVs + "<p style='font-size:5rem; margin-top: -30px'>" + p2 + " wins this game !</p>"
				}
				endDiv.classList.remove("countdown");
				endDiv.style.fontSize = "5rem";
				endDiv.classList.add("visible");
			}
		} else {
			this.nextTimeout = setTimeout(() => {
				this.initAngle = Math.random() * 90;
				this.velocity = new THREE.Vector3(0, 0, 0);
				if (player == 1) {
					this.velocity.x = Math.sin((this.initAngle + 135) * Math.PI / 180);
					this.velocity.y = Math.cos((this.initAngle + 135) * Math.PI / 180);
				} else {
					this.velocity.x = Math.sin((this.initAngle - 45) * Math.PI / 180);
					this.velocity.y = Math.cos((this.initAngle - 45) * Math.PI / 180);
				}
				this.pong.endRound = false;
				this.speed = this.initSpeed;
				if (this.pong.assets.bonus) {
					this.pong.assets.bonus.bonus.position.x = (Math.random() - 0.5) * 12;
					this.pong.assets.bonus.bonus.position.y = (Math.random() - 0.5) * 4;
					this.pong.assets.bonus.startTime = 0;
					this.pong.assets.bonus.type = Math.floor(Math.random() * 5);
				}
				if (this.pong.assets.p1.AI) {
					this.pong.assets.p1.stopAI();
					this.pong.assets.p1.startAI();
				}
				if (this.pong.assets.p2.AI) {
					this.pong.assets.p2.stopAI();
					this.pong.assets.p2.startAI();
				}
			}, 1000);
		}
	}
	//resetBallMulti() {

	//}
	
	checkCollisionPlayer(player) {
		let x = this.getPos().x;
		let pong = this.pong;
		var side = false;
		var sideLate = false;
		if (player == 1) {
			var maxPos = -this.maxPlayerPos;
			if (this.ball.position.y < -this.maxPlayerPos) {
				side = true;
				if (this.ball.position.y < -this.maxPlayerPos - 0.3)
					sideLate = true;
			}
			var xPlayer = pong.assets.p1.getPos().x;
			var sizePlayer = 1.0 + pong.assets.p1.bonus.big.time - pong.assets.p1.bonus.small.time / 2;
			var xVel = pong.assets.p1.getVelocity().x / 2;
			var minY = 0.05;
			var angle = 0;
			var coef = 1;
		} else {
			var maxPos = this.maxPlayerPos;
			if (this.ball.position.y > this.maxPlayerPos) {
				if (this.ball.position.y > this.maxPlayerPos + 0.3)
					sideLate = true;
				side = true;
			}
			var xPlayer = pong.assets.p2.getPos().x;
			var sizePlayer = 1.0 + pong.assets.p2.bonus.big.time - pong.assets.p2.bonus.small.time / 2;	
			var xVel = pong.assets.p2.getVelocity().x / 2
			var minY = -0.05;
			var angle = 180;
			var coef = -1;
		}
		if (x > xPlayer - sizePlayer && x < xPlayer + sizePlayer){
			if (sideLate) {
				return ;
			} else if (side) {
				this.ball.position.y = maxPos;	
			}
			let impact = coef * (x - xPlayer) / sizePlayer;
			let normalAngle = impact * 10 + angle;
			let normalVector = new THREE.Vector3(0, 0, 0);
			normalVector.x = Math.sin(normalAngle * Math.PI / 180) - xVel;
			normalVector.y = Math.cos(normalAngle * Math.PI / 180);
			normalVector.normalize();
			let vel = this.velocity.clone();
			let norm = normalVector.clone();
			let reflected = new THREE.Vector3(0, 0, 0);
			vel.sub(norm.multiplyScalar(vel.dot(normalVector) * 2));
			vel.y = Math.max(vel.y, minY / this.speed);
			vel.normalize();
			this.velocity.x = vel.x;
			this.velocity.y = vel.y;
			this.pong.lastHit = player;
			if (this.pong.assets.impactParticles)
				this.pong.assets.impactParticles.AddParticles();
			this.pong.exchange++;
			if (this.pong.assets.bonus && this.pong.exchange == 2 && this.pong.gameInfo.bonuses)
				this.pong.assets.bonus.active = true;
			this.speed = this.initSpeed + Math.min(this.pong.exchange / 300, 0.15);
		}
	}

	delete() {
		this.pong.scene.remove(this.ball);
		this.pong.assets.ball = undefined;
	}

	getPos() {return(this.ball.position.clone());}
	getVelocity() {return(this.velocity.clone());}
	getSpeed() {return(this.speed + Math.min(this.pong.exchange / 300, 0.15));}
}

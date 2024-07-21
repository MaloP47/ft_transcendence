// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   Bonus.js                                           :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/24 13:05:45 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/17 10:11:44 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import * as THREE from 'three';
import bonusVertexShader from './assets/shaders/bonusV.js'
import bonusFragmentShader from './assets/shaders/bonusF.js'

export default class Bonus {
	constructor(data) {
		this.pong = data.pong;
		this.geometry = new THREE.PlaneGeometry(3.5, 3.5);
		this.material = new THREE.ShaderMaterial({
			vertexShader: bonusVertexShader,
			fragmentShader: bonusFragmentShader,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: false,
			transparent: true,
		});
		this.bonus = new THREE.Mesh(this.geometry, this.material);
		this.bonus.position.x = (Math.random() - 0.5) * 12;
		this.bonus.position.y = (Math.random() - 0.5) * 4;
		this.bonus.scale.x = 0;
		this.bonus.scale.y = 0;
		this.pong.scene.add(this.bonus);
		this.active = false;
		this.startTime = 0;
		this.type = Math.floor(Math.random() * 5);
	}

	reset() {
		clearTimeout(this.nextTimeout);
		this.bonus.position.x = (Math.random() - 0.5) * 12;
		this.bonus.position.y = (Math.random() - 0.5) * 4;
		this.bonus.scale.x = 0;
		this.bonus.scale.y = 0;
		this.active = false;
		this.startTime = 0;
		this.type = Math.floor(Math.random() * 5);
	}

	getPos() {return(this.bonus.position.clone());}
	isActive() {return (this.active && this.startTime > 750);}
	
	setBonus(p1bonus, p2bonus) {
		if (this.pong.lastHit == 1) {
			p1bonus.on = true;
			setTimeout(() => {
				p1bonus.end = true;
			}, "10000");
		} else {
			p2bonus.on = true;
			setTimeout(() => {
				p2bonus.end = true;
			}, "10000");
		}
	}

	setActive(val) {
				//console.log(val)
		if (val == false) {
			this.active = false;
			if (this.pong.endRound)
				return;
			if (this.type == 0)
				this.setBonus(this.pong.assets.p1.bonus.big, this.pong.assets.p2.bonus.big)
			else if (this.type == 1)
				this.setBonus(this.pong.assets.p1.bonus.small, this.pong.assets.p2.bonus.small)
			else if (this.type == 2)
				this.setBonus(this.pong.assets.p1.bonus.line, this.pong.assets.p2.bonus.line)
			else if (this.type == 3)
				this.setBonus(this.pong.assets.p1.bonus.frozen, this.pong.assets.p2.bonus.frozen)
			else if (this.type == 4)
				this.setBonus(this.pong.assets.p1.bonus.reversed, this.pong.assets.p2.bonus.reversed)
			//console.log("send bonus in 15 sec")
			this.nextTimeout = setTimeout(() => {
				console.log("send bonus info now")
				this.bonus.position.x = (Math.random() - 0.5) * 12;
				this.bonus.position.y = (Math.random() - 0.5) * 4;
				if (this.bonus.position.y >= 0 && this.bonus.position.y < 0.5)
					this.bonus.position.y = 0.5;
				if (this.bonus.position.y < 0 && this.bonus.position.y > -0.5)
					this.bonus.position.y = -0.5;
				this.startTime = 0;
				this.active = true;
				this.type = Math.floor(Math.random() * 5);
			}, "15000");
		} else {
			this.active = true;	
		}
	}

	updateMulti() {
		this.active = this.pong.multiData.bonus_active;
		this.bonus.position.x = this.pong.multiData.bonus_pos.x;
		this.bonus.position.y = this.pong.multiData.bonus_pos.y;
		this.startTime = this.pong.multiData.bonus_startTime;
		this.type = this.pong.multiData.bonus_type;
	}

	update() {
		// Multi
		if (this.pong.isMultiNotHost())
			this.updateMulti();
		
		if (!this.active){
			if (this.bonus.scale.x > 0) {
				this.bonus.scale.x -= this.pong.elapsedTime / 400;

				this.bonus.scale.y -= this.pong.elapsedTime / 400;
			} else {
				this.bonus.scale.x = 0;
				this.bonus.scale.y = 0;
			}
			return ;
		}
		this.startTime += this.pong.elapsedTime;
		if (this.startTime < 500)
			return ;
		else if (this.startTime < 1000) {
			this.bonus.scale.x = (this.startTime - 500) / 500;
			this.bonus.scale.y = (this.startTime - 500) / 500;
		} else if (this.bonus.scale.x != 1) {
			this.bonus.scale.x = 1;
			this.bonus.scale.y = 1;
		}
	}
}

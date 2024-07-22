// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   BallFire.js                                        :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/24 13:01:11 by gbrunet           #+#    #+#             //
//   Updated: 2024/05/24 16:23:19 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import * as THREE from 'three';
import LinearSpline from './LinearSpline.js';
import fireVertexShader from './assets/shaders/fireV.js'
import fireFragmentShader from './assets/shaders/fireF.js'

export default class BallFire {
	constructor(data) {
		this.pong = data.pong;
		this.particleShader = new THREE.ShaderMaterial({
			vertexShader: fireVertexShader,
			fragmentShader: fireFragmentShader,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: false,
			transparent: true,
		});
		this.ballFire = [];
		this.geometry = new THREE.BufferGeometry();
		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
		this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
		this.geometry.setAttribute('age', new THREE.Float32BufferAttribute([], 1));
		this.points = new THREE.Points(this.geometry, this.particleShader);
		this.sizeSpline = new LinearSpline((t, a, b) => {
			return (a + t * (b - a));
		});
		this.sizeSpline.AddPoint(0.0, 1.0);
		this.sizeSpline.AddPoint(0.1, 50.0);
		this.sizeSpline.AddPoint(0.5, 20.0);
		this.sizeSpline.AddPoint(1.0, 0.0);
		this.pong.scene.add(this.points);
	}

	AddParticles() {
		// Multi Host
		if (this.pong.isMultiHost()) {
			this.pong.setMultiData('t_ballFire', true);
			this.pong.setMultiData('t_ballFire_pos', this.pong.assets.ball.prevPos);
		}
		// Multi Guest
		if (this.pong.isMultiNotHost() && !this.pong.multiData.t_ballFire)
			return ;
		var trigger_multi = this.pong.isMultiNotHost() && this.pong.multiData.t_ballFire;
		if (trigger_multi)
			var pospos = this.pong.multiData.t_ballFire_pos;

		for (let i = 0; i < (30 + 50 * this.pong.assets.ball.getSpeed()) * this.pong.elapsedTime / 5; i++) {
			const life = (Math.random() + 0.5) / 2 * this.pong.assets.ball.getSpeed() * 5;
			var rdm = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);

			if (trigger_multi)
				var pos = new THREE.Vector3(pospos.x, pospos.y, pospos.z);
			else
				var pos = this.pong.assets.ball.getPos();
			rdm.divideScalar(4);
			this.ballFire.push({
				//position: this.pong.assets.ball.getPos(),
				position: pos,
				velocity: this.pong.assets.ball.getVelocity().multiplyScalar(-0.55).add(rdm).multiplyScalar(Math.random() + 0.5 * this.pong.elapsedTime / 20),
				size: Math.random() * this.pong.scaleFactor,
				life: life,
				age: life,
			})
		}
	}

	UpdateGeometry() {
		const positions = [];
		const sizes = [];
		const ages = [];
		for (let p of this.ballFire) {
			positions.push(p.position.x, p.position.y, p.position.z);
			sizes.push(p.currentSize);
			ages.push(p.currentAge);
		}
		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
		this.geometry.setAttribute('age', new THREE.Float32BufferAttribute(ages, 1));
		this.geometry.attributes.position.needsUpdate = true;
		this.geometry.attributes.size.needsUpdate = true;
		this.geometry.attributes.age.needsUpdate = true;
	}

	UpdateParticles(elapsedTime) {
		for (let p of this.ballFire) {
			p.age -= elapsedTime;
		}
		this.ballFire = this.ballFire.filter(p => {
			return (p.age > 0.0);
		})
		for (let p of this.ballFire) {
			const t = 1.0 - p.age / p.life;
			p.currentSize = p.size * this.sizeSpline.Get(t);
			p.currentAge = t;
			p.position.add(p.velocity);
			p.velocity = p.velocity.divideScalar(1.75 / elapsedTime);
		}
	}

	delete() {
		this.ballFire = [];
		this.UpdateGeometry();
		this.pong.assets.ballFire = undefined;
	}

	update() {
		if (!this.pong.endRound)
			this.AddParticles();
		this.UpdateParticles(this.pong.elapsedTime / 1000.0);
		this.UpdateGeometry();
	}
}

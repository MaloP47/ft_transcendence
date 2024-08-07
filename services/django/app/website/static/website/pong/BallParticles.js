// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   BallParticles.js                                   :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/24 12:51:59 by gbrunet           #+#    #+#             //
//   Updated: 2024/05/24 16:14:24 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import * as THREE from 'three';
import LinearSpline from './LinearSpline.js';
import ballParticleVertexShader from './assets/shaders/ballParticleV.js'
import ballParticleFragmentShader from './assets/shaders/ballParticleF.js'

export default class BallParticles {
	constructor(data) {
		this.pong = data.pong;
		this.particleShader = new THREE.ShaderMaterial({
			vertexShader: ballParticleVertexShader,
			fragmentShader: ballParticleFragmentShader,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: false,
			transparent: true,
		});
		this.ballParticles = [];
		this.lastEmit = 0;
		this.nextEmit = 100;
		this.geometry = new THREE.BufferGeometry();
		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
		this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
		this.geometry.setAttribute('age', new THREE.Float32BufferAttribute([], 1));
		this.points = new THREE.Points(this.geometry, this.particleShader);
		this.sizeSpline = new LinearSpline((t, a, b) => {
			return (a + t * (b - a));
		});
		this.sizeSpline.AddPoint(0.0, 0.0);
		this.sizeSpline.AddPoint(2.0, 300.0);
		this.pong.scene.add(this.points);
	}

	AddParticles() {
		// Multi Host
		if (this.pong.isMultiHost()) {
			this.pong.setMultiData('t_ballParticles', true);
			this.pong.setMultiData('t_ballParticles_pos', this.pong.assets.ball.prevPos);
		}
		// Multi Guest
		if (this.pong.isMultiNotHost() && !this.pong.multiData.t_ballParticles)
			return ;
		var trigger_multi = this.pong.isMultiNotHost() && this.pong.multiData.t_ballParticles;
		if (trigger_multi)
			var pospos = this.pong.multiData.t_ballParticles_pos;

		if(this.pong.totalTime > this.lastEmit + this.nextEmit) {
			this.lastEmit = this.pong.totalTime;

			if (trigger_multi)
				var pos = new THREE.Vector3(pospos.x, pospos.y, pospos.z);
			else
				var pos = this.pong.assets.ball.getPos();
			this.ballParticles.push({
				//position: this.pong.assets.ball.getPos(),
				position: pos,
				velocity: this.pong.assets.ball.getVelocity(),
				size: this.pong.scaleFactor,
				life: 1.25,
				age: 1.25,
			})
		}
	}

	UpdateGeometry() {
		const positions = [];
		const sizes = [];
		const ages = [];
		for (let p of this.ballParticles) {
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
		for (let p of this.ballParticles) {
			p.age -= elapsedTime;
		}
		this.ballParticles = this.ballParticles.filter(p => {
			return (p.age > 0.0);
		})
		for (let p of this.ballParticles) {
			const t = 1.0 - p.age / p.life;
			p.currentSize = p.size * this.sizeSpline.Get(t);
			p.currentAge = t;
		}
	}

	delete() {
		this.ballParticles = [];
		this.UpdateGeometry();
		this.pong.assets.ballParticles = undefined;
	}

	update() {
		if (!this.pong.endRound)
			this.AddParticles();
		this.UpdateParticles(this.pong.elapsedTime / 1000.0);
		this.UpdateGeometry();
	}
}

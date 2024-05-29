// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   BonusParticles.js                                  :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/24 12:59:36 by gbrunet           #+#    #+#             //
//   Updated: 2024/05/24 16:16:27 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import * as THREE from 'three';
import LinearSpline from './LinearSpline.js';
import bonusParticlesVertexShader from './assets/shaders/bonusParticlesV.js'
import bonusParticlesFragmentShader from './assets/shaders/bonusParticlesF.js'

export default class BonusParticles {
	constructor(params) {
		this.pong = params.pong;
		this.particleShader = new THREE.ShaderMaterial({
			vertexShader: bonusParticlesVertexShader,
			fragmentShader: bonusParticlesFragmentShader,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: false,
			transparent: true,
		});
		this.bonusParticles = [];
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
		if (!this.pong.bonus.active)
			return ;
		for (let i = 0; i < 3; i++) {
			const life = (Math.random() + 0.5) * 0.75 + 2;
			var rdm = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
			var vel = new THREE.Vector3(-rdm.y, rdm.x, rdm.z);
			this.bonusParticles.push({
				position: this.pong.bonus.getPos().add(rdm.multiplyScalar(10.0)),
				velocity: vel.multiplyScalar(-0.25),
				size: Math.random() * 0.75,
				life: life,
				age: life,
			})
		}
	}

	UpdateGeometry() {
		const positions = [];
		const sizes = [];
		const ages = [];
		for (let p of this.bonusParticles) {
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
		for (let p of this.bonusParticles) {
			p.age -= elapsedTime;
		}
		this.bonusParticles = this.bonusParticles.filter(p => {
			return (p.age > 0.0);
		})
		for (let p of this.bonusParticles) {
			const t = 1.0 - p.age / p.life;
			p.currentSize = p.size * this.sizeSpline.Get(t);
			p.currentAge = t;
			if (!this.pong.bonus.active && this.pong.bonus.startTime > 500)
				p.age -= elapsedTime * 2.0;
			p.position.add(p.velocity);
			var dir = this.pong.bonus.getPos().sub(p.position).divideScalar(750 * this.pong.elapsedTime / 10);
			p.velocity.add(dir).divideScalar(1.05);
		}
	}

	reset() {
		this.bonusParticles = [];
		this.UpdateGeometry();
	}

	Update() {
		this.AddParticles();
		this.UpdateParticles(this.pong.elapsedTime / 1000.0);
		this.UpdateGeometry();
	}
}

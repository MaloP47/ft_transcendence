// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   ImpactParticles.js                                 :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/05/24 14:38:37 by gbrunet           #+#    #+#             //
//   Updated: 2024/05/24 14:58:54 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import * as THREE from 'three';
import LinearSpline from './LinearSpline.js';
import impactParticlesVertexShader from './assets/shaders/impactParticlesV.glsl'
import impactParticlesFragmentShader from './assets/shaders/impactParticlesF.glsl'

export default class ImpactParticles {
	constructor(params) {
		this.pong = params.pong;
		this.particleShader = new THREE.ShaderMaterial({
			vertexShader: impactParticlesVertexShader,
			fragmentShader: impactParticlesFragmentShader,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: false,
			transparent: true,
		});
		this.impactParticles = [];
		this.geometry = new THREE.BufferGeometry();
		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
		this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));
		this.geometry.setAttribute('age', new THREE.Float32BufferAttribute([], 1));
		this.points = new THREE.Points(this.geometry, this.particleShader);
		this.sizeSpline = new LinearSpline((t, a, b) => {
			return (a + t * (b - a));
		});
		this.sizeSpline.AddPoint(0.0, 0.0);
		this.sizeSpline.AddPoint(0.1, 50.0);
		this.sizeSpline.AddPoint(0.5, 50.0);
		this.sizeSpline.AddPoint(1.0, 0.0);
		this.pong.scene.add(this.points);
	}

	AddParticles() {
		for (let i = 0; i < 70; i++) {
			const life = (Math.random() + 0.5) * 0.25;
			var vel = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
			this.impactParticles.push({
				position: this.pong.ball.getPos(),
				velocity: vel.multiplyScalar(0.3),
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
		for (let p of this.impactParticles) {
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
		for (let p of this.impactParticles) {
			p.age -= elapsedTime;
		}
		this.impactParticles = this.impactParticles.filter(p => {
			return (p.age > 0.0);
		})
		for (let p of this.impactParticles) {
			const t = 1.0 - p.age / p.life;
			p.currentSize = p.size * this.sizeSpline.Get(t);
			p.currentAge = t;
			p.position.add(p.velocity.clone().multiplyScalar(this.pong.elapsedTime / 12));
		}
	}

	reset() {
		this.impactParticles = [];
		this.UpdateGeometry();
	}

	Update() {
//		this.AddParticles();
		this.UpdateParticles(this.pong.elapsedTime / 1000.0);
		this.UpdateGeometry();
	}
}

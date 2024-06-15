import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import bgVertexShader from './assets/shaders/bgV.js'
import bgFragmentShader from './assets/shaders/bgF.js'
import dotVertexShader from './assets/shaders/dotV.js'
import dotFragmentShader from './assets/shaders/dotF.js'
import fadeVertexShader from './assets/shaders/fadeV.js'
import fadeFragmentShader from './assets/shaders/fadeF.js'
import playerVertexShader from './assets/shaders/playerV.js'
import playerFragmentShader from './assets/shaders/playerF.js'
import vignetteVertexShader from './assets/shaders/vignetteV.js'
import vignetteFragmentShader from './assets/shaders/vignetteF.js'

export default class PongScene {
	constructor(data) {
		this.pong = data.pong;
		this.initScene();
		this.initMesh();
	}

	initScene() {
		this.threeJs = new THREE.WebGLRenderer({
			antialias: true,
		});
		this.threeJs.setSize(this.pong.WIDTH, this.pong.HEIGHT);
		this.threeJs.setPixelRatio(window.devicePixelRatio * 1)
		this.canvas = document.getElementById('canvas').appendChild(this.threeJs.domElement);
		this.camera = new THREE.PerspectiveCamera(58, this.pong.WIDTH / this.pong.HEIGHT, 0.1, 1000);
		this.camera.position.set(0, 0, 27);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.scene = new THREE.Scene();	
		this.scene.background = new THREE.Color(0x596077);
		this.composer = new EffectComposer(this.threeJs);
		const renderPass = new RenderPass(this.scene, this.camera);
		this.composer.addPass(renderPass);
		this.dot = new ShaderPass(new THREE.ShaderMaterial({
			uniforms: {
				'tDiffuse': {value: null},
				'tSize': {value: new THREE.Vector2(256, 256)},
				'center': {value: new THREE.Vector2(0.5, 0.5)},
				'angle': {value: 1.57},
				'scale': {value: 4.0},
				'amount': {value: 1.0}
			},
			vertexShader: dotVertexShader,
			fragmentShader: dotFragmentShader,
		}));
		this.composer.addPass(this.dot);
		this.fade = new ShaderPass(new THREE.ShaderMaterial({
			uniforms: {
				'tDiffuse': { value: null },
				'amount': {value: 0}
			},
			vertexShader: fadeVertexShader,
			fragmentShader: fadeFragmentShader,
		}));
		this.composer.addPass(this.fade);
		this.vignette = new ShaderPass(new THREE.ShaderMaterial({
			uniforms: {
				'tDiffuse': { value: null },
				'amount': {value: 1},
				'lines': {value: this.pong.HEIGHT / 4},
				'time': {value: this.totalTime},
			},
			vertexShader: vignetteVertexShader,
			fragmentShader: vignetteFragmentShader,
		}));
		this.composer.addPass(this.vignette);
	}

	initMesh() {
		this.backPlaneGeo = new THREE.PlaneGeometry(15.5, 21.5);
		this.bgShader = new THREE.ShaderMaterial({
			vertexShader: bgVertexShader,
			fragmentShader: bgFragmentShader,
		});
		this.backPlane = new THREE.Mesh(this.backPlaneGeo, this.bgShader);
		this.backPlane.position.z = -0.4;
		this.scene.add(this.backPlane);

		this.playerPlaneGeo = new THREE.PlaneGeometry(15.5, 21.5);
		this.playerShader = new THREE.ShaderMaterial({
			vertexShader: playerVertexShader,
			fragmentShader: playerFragmentShader,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: false,
			transparent: true,
		});
		this.playerPlane = new THREE.Mesh(this.playerPlaneGeo, this.playerShader);
		this.scene.add(this.playerPlane);
	}

	add(obj) {
		this.scene.add(obj);
	}

	update() {
		this.updateShaders();
		this.composer.render();
	}

	updateShaders() {
		this.vignette.material.uniforms.time = {value: this.totalTime};
		if (this.bonusParticles) {
			this.bonusParticles.particleShader.uniforms.uCenter = {value: this.bonus.getPos()};
			this.bonusParticles.particleShader.uniforms.uType = {value: this.bonus.type};
		}
		if (this.ballParticles)
			this.ballParticles.particleShader.uniforms.uTime = {value: this.totalTime};
		this.bgShader.uniforms.uInfos = {
			value: {
				p1Pos: [this.pong.assets.p1.getPos().x, this.pong.assets.p1.getPos().y],
				p2Pos: [this.pong.assets.p2.getPos().x, this.pong.assets.p2.getPos().y],
				time: this.pong.totalTime,
				p1Bonus: this.pong.assets.p1.bonus,
				p2Bonus: this.pong.assets.p2.bonus,
			}
		}
		this.playerShader.uniforms.uInfos = {
			value: {
				p1Pos: [this.pong.assets.p1.getPos().x, this.pong.assets.p1.getPos().y],
				p2Pos: [this.pong.assets.p2.getPos().x, this.pong.assets.p2.getPos().y],
				time: this.pong.totalTime,
				p1Bonus: this.pong.assets.p1.bonus,
				p2Bonus: this.pong.assets.p2.bonus,
			}
		}
		if (this.bonus) {
			this.bonus.material.uniforms.uTime = {value: this.totalTime};
			this.bonus.material.uniforms.uType = {value: this.bonus.type};
		}
	}

	resize() {
		this.camera.aspect = this.pong.WIDTH / this.pong.HEIGHT;
		this.camera.updateProjectionMatrix();
		this.threeJs.setSize(this.pong.WIDTH, this.pong.HEIGHT);
		this.composer.setSize(this.pong.WIDTH, this.pong.HEIGHT);
		this.vignette.uniforms['lines'].value = yhis.pong.HEIGHT / 4;
	}
}

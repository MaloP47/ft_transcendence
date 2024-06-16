import * as THREE from 'three';

export default class PongTransi {
	constructor(data) {
		this.pong = data.pong;
		this.active = false;
		this.transi = ""
	}

	toBlack(time) {
		if (time != undefined) {
			this.initTransi("toBlack", time);
			this.startCamPos = this.pong.scene.camera.position.clone();
			this.startCamRot = this.pong.scene.camera.rotation.clone();
			this.startFade = this.pong.scene.fade.uniforms['amount'].value;
  			return new Promise(resolve => setTimeout(resolve, time));
		}
		if (this.time > this.transiTime) {
			this.active = false;
			return ;
		}
		this.time += this.pong.elapsedTime;
		let progress = Math.min(this.time / this.transiTime, 1);
		this.pong.scene.fade.uniforms['amount'].value = this.interpolate(progress, this.startFade, 0);
		this.pong.scene.camera.position.set(
			this.interpolate(this.easeInCubic(progress), this.startCamPos.x, 50),
			this.interpolate(this.easeInCubic(progress), this.startCamPos.y, 50),
			this.interpolate(this.easeInCubic(progress), this.startCamPos.z, 100)
		);
		this.pong.scene.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.pong.scene.camera.rotation.z = this.interpolate(progress, this.startCamRot.z, this.startCamRot.z + 1);
	}

	toBg(time) {
		if (time != undefined) {
			this.initTransi("toBg", time);
			this.pong.scene.vignette.uniforms['amount'].value = 0;
			this.pong.assets.p1.AI = true;
			this.pong.assets.p2.AI = true;
			this.pong.assets.p1.startAI();
			this.pong.assets.p2.startAI();
  			return new Promise(resolve => setTimeout(resolve, time));
		}
		if (this.time > this.transiTime) {
			this.transi = "bg";
			return ;
		}
		this.time += this.pong.elapsedTime;
		let progress = this.easeOutCubic(Math.min(this.time / this.transiTime, 1));
		this.pong.scene.fade.uniforms['amount'].value = progress * 0.5;
		this.pong.scene.camera.position.set(
			Math.cos(this.pong.totalTime / 3000) * 18,
			Math.sin(this.pong.totalTime / 2000) * 18,
			Math.sin(this.pong.totalTime / 2500) * 7 + 18 + (1 - progress) * 100
		);
		this.pong.scene.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.pong.scene.camera.rotation.z = this.pong.totalTime / 2000 + 3.1415 / 2 - (1 - progress) * 3;
	}

	bg() {
		this.pong.scene.camera.position.set(
			Math.cos(this.pong.totalTime / 3000) * 18,
			Math.sin(this.pong.totalTime / 2000) * 18,
			Math.sin(this.pong.totalTime / 2500) * 7 + 18
		);
		this.pong.scene.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.pong.scene.camera.rotation.z = this.pong.totalTime / 2000 + 3.1415 / 2;
	}

	toP1Game(time) {
		if (time != undefined) {
			this.initTransi("toP1Game", time);
			this.pong.assets.reset();
			this.pong.bg = false;
			this.pong.scene.vignette.uniforms['amount'].value = 0;
  			return new Promise(resolve => setTimeout(resolve, time));
		}
		if (this.time > this.transiTime) {
			this.transi = "p1Game";
			this.pong.start = true;
			return ;
		}
		this.time += this.pong.elapsedTime;
		let progress = this.easeOutCubic(Math.min(this.time / this.transiTime, 1));
		this.pong.scene.vignette.uniforms['amount'].value = 1;
		if (this.pong.HEIGHT < 800) {
			this.pong.scene.camera.position.set(0, (1 - progress) * -20 - 13, 20 + (800 - HEIGHT) / 20);
			this.pong.scene.camera.lookAt(new THREE.Vector3(0, progress * (2 - (HEIGHT / 800) * 4), 0));
		} else {
			this.pong.scene.camera.position.set(0, (1 - progress) * -20 - 13, 20 + (1 - progress) * 10);
			this.pong.scene.camera.lookAt(new THREE.Vector3(0, progress * -2, 0));	
		}
		this.pong.scene.fade.uniforms['amount'].value = Math.min(progress, 0.75) / 0.75;
		this.pong.scene.dot.uniforms['amount'].value = 1 - Math.max(progress - 0.25, 0) / 0.75;
	}

	p1Game() {
		if (this.pong.HEIGHT < 800) {
			this.pong.scene.camera.position.set(0, -13, 20 + (800 - HEIGHT) / 20);
			this.pong.scene.camera.lookAt(new THREE.Vector3(0, 2 - (HEIGHT / 800) * 4, 0));
		} else {
			this.pong.scene.camera.position.set(0, -13, 20);
			this.pong.scene.camera.lookAt(new THREE.Vector3(0, -2, 0));	
		}
	}

	initTransi(transi, time) {
		this.active = true;
		this.transi = transi;
		this.time = 0;
		this.transiTime = time;
	}

	easeInCubic(t) {
		return (t * t * t);
	}

	easeOutCubic(t) {
		return (1 - Math.pow(1 - t, 3));
	}

	interpolate(progress, from, to) {
		return (progress * (to - from) + from);
	}

	update() {
		if (!this.active)
			return ;
		if (this.transi == "toBlack")
			this.toBlack();
		else if (this.transi == "toBg")
			this.toBg();
		else if (this.transi == "bg")
			this.bg();
		else if (this.transi == "toP1Game")
			this.toP1Game();
		else if (this.transi == "p1Game")
			this.p1Game();
	}
}

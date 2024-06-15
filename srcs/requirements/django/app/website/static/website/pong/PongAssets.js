import Ball from './Ball.js';
import Player from './Player.js';

export default class PongAssets {
	constructor(data) {
		this.pong = data.pong;
		this.initAssets();
	}

	initAssets() {
		this.ball = new Ball({pong: this.pong});
//		this.ballFire = new BallFire({pong: this});
//		this.ballParticles = new BallParticles({pong: this});
//		this.impactParticles = new ImpactParticles({pong: this});

//		this.bonus = new Bonus({pong: this});
//		this.bonusParticles = new BonusParticles({pong: this});

		this.p1 = new Player({pong: this, player:1});
		this.p2 = new Player({pong: this, player:2});
//		this.p1.setAI(true);
//		this.p2.setAI(true);
	}
}

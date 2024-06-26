// ************************************************************************** //
//                                                                            //
//                                                        :::      ::::::::   //
//   PongAssets.js                                      :+:      :+:    :+:   //
//                                                    +:+ +:+         +:+     //
//   By: gbrunet <gbrunet@student.42.fr>            +#+  +:+       +#+        //
//                                                +#+#+#+#+#+   +#+           //
//   Created: 2024/06/20 09:18:54 by gbrunet           #+#    #+#             //
//   Updated: 2024/06/20 09:19:30 by gbrunet          ###   ########.fr       //
//                                                                            //
// ************************************************************************** //

import Ball from './Ball.js';
import BallFire from './BallFire.js';
import BallParticles from './BallParticles.js';
import ImpactParticles from './ImpactParticles.js';
import Player from './Player.js';
import Bonus from './Bonus.js';
import BonusParticles from './BonusParticles.js';

export default class PongAssets {
	constructor(data) {
		this.pong = data.pong;
		this.initAssets();
	}

	initAssets() {
		this.ball = new Ball({pong: this.pong});
		this.ballFire = new BallFire({pong: this.pong});
		this.ballParticles = new BallParticles({pong: this.pong});
		this.impactParticles = new ImpactParticles({pong: this.pong});
		this.bonus = new Bonus({pong: this.pong});
		this.bonusParticles = new BonusParticles({pong: this.pong});

		this.p1 = new Player({pong: this.pong, player:1});
		this.p2 = new Player({pong: this.pong, player:2});
	}

	update() {
		this.p1.update();
		this.p2.update();
		if (this.pong.start) {
			this.ball.update();
			this.ballFire.update();
			this.ballParticles.update();
			this.impactParticles.update();
			this.bonus.update();
			this.bonusParticles.update();
		}
	}

	reset() {
		this.ball.delete();
		if (this.ballFire) {
			this.ballFire.delete();
			this.ballFire = new BallFire({pong: this.pong});
		}
		if (this.ballParticles) {
			this.ballParticles.delete();
			this.ballParticles = new BallParticles({pong: this.pong});
		}
		if (this.impactParticles) {
			this.impactParticles.delete();
			this.impactParticles = new ImpactParticles({pong: this.pong});
		}
		if (this.pong.bonus) {
			if (this.bonus) {
				this.bonus.reset();
			}
			if (this.bonusParticles) {
				this.bonusParticles.delete();	
				this.bonusParticles = new BonusParticles({pong: this.pong})
			}
		}
		this.ball = new Ball({pong: this.pong});
		this.pong.exchange = 0;
		this.p1.stopAI();
		this.p2.stopAI();
		this.p1 = new Player({pong: this.pong, player:1});
		this.p2 = new Player({pong: this.pong, player:2});
	}
}

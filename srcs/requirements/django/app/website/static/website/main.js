import App from './state/StateMachine.js';
import Pong from './pong/Pong.js';

window.addEventListener('DOMContentLoaded', () => {
	setTimeout(() => {
		const website = App.get();
		website.pong = new Pong();
		website.pong.stateMachine = website;
	}, 250)
})

/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pong.sol                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mpeulet <mpeulet@student.42.fr>            #+#  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024-06-13 08:46:29 by mpeulet           #+#    #+#             */
/*   Updated: 2024-06-13 08:46:29 by mpeulet          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

pragma solidity ^0.8.4;

import "./ownable.sol";

contract Pong is Ownable {

	event	NewTournament(uint tournamentId, uint8 winnerId, uint8 wins, uint8 losses);
	event	Received(address sender, uint amount);
    event	Withdrawn(address owner, uint amount);

	struct Tournament {
		uint8	winnerId;
		uint8	winnerWins;
		uint8	winnerLosses;
	}

	Tournament[] public tournaments;

	modifier	hasStarted() {
		require(tournaments.length > 0, "No tournaments have been started yet");
		_;
	}

	modifier	outOfBounds(uint _id) {
		require(_id < tournaments.length, "Tournament ID doesn't exist.");
		_;
	}

	function	createTournament(uint8 _winnerId, uint8 _wins, uint8 _losses) public onlyOwner() {
		tournaments.push(Tournament(_winnerId, _wins, _losses));
		uint id = tournaments.length - 1;
		emit NewTournament(id, _winnerId, _wins, _losses);
	}

	function	getTournament(uint _id) external view hasStarted() returns (
		uint8	winnerId,
		uint8	winnerWins,
		uint8	winnerLosses
	) {
		require(_id < tournaments.length, "Tournament ID doesn't exist.");
		Tournament storage tournament = tournaments[_id];
		winnerId = tournament.winnerId;
		winnerWins = tournament.winnerWins;
		winnerLosses = tournament.winnerLosses;
	}

	function	getWinnerId(uint _id) external view hasStarted outOfBounds(_id) returns (uint8) {
		return tournaments[_id].winnerId;
	}

	function	getWinnerWins(uint _id) external view hasStarted outOfBounds(_id) returns (uint8) {
		return tournaments[_id].winnerWins;
	}

	function	getWinnerLosses(uint _id) external view hasStarted outOfBounds(_id) returns (uint8) {
		return tournaments[_id].winnerLosses;
	}

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function	getBalance() external view returns (uint) {
        return address(this).balance;
    }

	function	getTournamentLength() external view returns (uint) {
		return tournaments.length;
	}

    function	withdraw(uint _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance in the contract");
        payable(owner()).transfer(_amount);
        emit Withdrawn(owner(), _amount);
    }
}

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const API_KEY = process.env.API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const { ethers } = require("hardhat");
const contract = require("../artifacts/contracts/pong.sol/Pong.json");

// provider - Alchemy
const alchemyProvider = new ethers.providers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`, {
  name: "sepolia",
  chainId: 11155111
});

// signer - me
const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);

const pongContract = new ethers.Contract(CONTRACT_ADDRESS, contract.abi, signer);

async function main() {
    try {
        // let getTour = await pongContract.getTournament(42);
        // console.log("Tournament result: " + getTour);

        // const createTour = await pongContract.createTournament(42, 5, 0);
        // await createTour.wait();

        // getTour = await pongContract.getTournament(2);
        // console.log("Tournament result: " + getTour);

		let tournamentCount = 0;
        while (true) {
            try {
                await pongContract.tournaments(tournamentCount);
                tournamentCount++;
            } catch (error) {
                break;
            }
        }
        console.log("Number of tournaments: ", tournamentCount);

    } catch (error) {
        console.error("Error in contract interaction:", error);
    }
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});

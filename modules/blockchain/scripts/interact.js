// require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });


// const API_KEY = process.env.API_KEY;
// const PRIVATE_KEY = process.env.PRIVATE_KEY;
// const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// const { ethers } = require("hardhat");
// const contract = require("../artifacts/contracts/pong.sol/Pong.json");


// // Define a custom provider for Sepolia
// const alchemyProvider = new ethers.providers.JsonRpcProvider(`https://eth-sepolia.alchemyapi.io/v2/${API_KEY}`, {
//   name: 'sepolia',
//   chainId: 11155111
// })

// // provider - Alchemy

// // const alchemyProvider = ethers.getDefaultProvider(sepoliaNetwork);

// // signer - me

// const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);

// const pongContract = new ethers.Contract(CONTRACT_ADDRESS, contract.abi, signer);

// async function	main() {
// 	const getTour = await pongContract.getTournament(42);
// 	console.log("Tournament result: " + getTour);

// 	const createTour = await pongContract.createTournament(42, 5, 0);
// 	await createTour.wait();
// 	getTour = await pongContract.getTournament(1);
// 	console.log("Tournament result: " + getTour);
// }

// main()
// .then(() => process.exit(0))
// .catch(error => {
//   console.error(error);
//   process.exit(1);
// });

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

        getTour = await pongContract.getTournament(0);
        console.log("Tournament result: " + getTour);
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

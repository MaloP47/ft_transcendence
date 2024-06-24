require('dotenv').config({ path: require('path').resolve(__dirname, '../srcs/.env') });
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

const { API_URL, PRIVATE_KEY } = process.env;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
	solidity: "0.8.4",
	defaultNetwork: "sepolia",
	networks: {
	  hardhat: {},
	  sepolia: {
		url: API_URL,
		accounts: [`0x${PRIVATE_KEY}`]
	  }
	},
	etherscan: {
		apiKey: {
			sepolia: ETHERSCAN_API_KEY
		}
	}
  }


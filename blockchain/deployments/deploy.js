async function main() {
	const Pong = await ethers.getContractFactory("Pong");
	const pong = await Pong.deploy();
	console.log("Contract Deployed to Address:", pong.address);
  }
  main()
	.then(() => process.exit(0))
	.catch(error => {
	  console.error(error);
	  process.exit(1);
	});
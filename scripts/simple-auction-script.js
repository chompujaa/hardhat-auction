const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  // const SimpleAuction = await hre.ethers.getContractFactory("SimpleAuction");
  // const simpleAuction = await SimpleAuction.deploy("Hello, Hardhat!");

  let bidPeriodTime = 300;
  let beneficiaryAddr = '0x02e70faDd127F9566bF937a509F3c813C5632897';
  SimpleAuctionContract = await ethers.getContractFactory("SimpleAuction");
  simpleAuction = await SimpleAuctionContract.deploy(bidPeriodTime, beneficiaryAddr);
  await simpleAuction.deployed();

  console.log("---Transcation complete---");
  console.log("Address... ", simpleAuction.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const { BigNumber } = require("@ethersproject/bignumber");
const timeMachine = require('ether-time-traveler');

describe("SimpleAuction", function() {

  let simpleAuction;
  
  beforeEach(async function () {
    let bidPeriodTime = 300;
    let beneficiaryAddr = '0x02e70faDd127F9566bF937a509F3c813C5632897';
    let SimpleAuctionContract = await ethers.getContractFactory("SimpleAuction");
    simpleAuction = await SimpleAuctionContract.deploy(bidPeriodTime, beneficiaryAddr);

    // console.log("---Transcation complete---");
    // console.log("Deploy address... ", simpleAuction.address);
  });
  
  it("Should return highest bid price", async function () {
    const [bider1, bider2] = await ethers.getSigners();
    // console.log("Bider1 ... ", bider1.address);
    // console.log("Bider2 ... ", bider2.address);
    
    //First bid
    let tx1 = await simpleAuction.bid({
      from: bider1.address,
      value: ethers.utils.parseEther("1")
    });
    await tx1.wait();

    //Second bid
    let tx2 = await simpleAuction.connect(bider2).bid({
      from: bider2.address,
      value: ethers.utils.parseEther("2")
    });
    await tx2.wait();
    
    let highestBid = ethers.utils.formatEther(await simpleAuction.highestBid.call());
    expect(highestBid).to.equal('2.0');
  });
  
  it("Should fail when bid with lower price", async function () {
    const [bider1, bider2] = await ethers.getSigners();
    
    //First bid
    let tx1 = await simpleAuction.bid({
      from: bider1.address,
      value: ethers.utils.parseEther("2")
    });
    await tx1.wait();

    //Bid with lower price
    await expect(
      simpleAuction.connect(bider2).bid({
        from: bider2.address,
        value: ethers.utils.parseEther("1")
      })
    ).to.be.revertedWith('BidNotHighEnough');
    
  });

  it("Should withdraw success", async function () {
    const [bider1, bider2, bider3] = await ethers.getSigners();
    console.log("Bider1 ... ", bider1.address);
    console.log("Bider2 ... ", bider2.address);
    console.log("Bider3 ... ", bider3.address);
    
    //First bid
    let tx1 = await simpleAuction.bid({
      from: bider1.address,
      value: ethers.utils.parseEther("1")
    });
    await tx1.wait();

    //Second bid
    let tx2 = await simpleAuction.connect(bider2).bid({
      from: bider2.address,
      value: ethers.utils.parseEther("2")
    });
    await tx2.wait();

    //Third bid
    let tx3 = await simpleAuction.connect(bider3).bid({
      from: bider3.address,
      value: ethers.utils.parseEther("3")
    });
    await tx3.wait();

    // console.log('simpleAuction before... ', simpleAuction);

    //Advance Time & end auction
    // await timeMachine.advanceTimeAndBlock(simpleAuction.provider, 600)
    let withdraw = await simpleAuction.withdraw()
    // console.log('withdraw ... ', withdraw);
    console.log('simpleAuction ... ', simpleAuction.provider._lastBlockNumber);
    
    // await simpleAuction.auctionEnd();

    // console.log('simpleAuction after... ', simpleAuction);
    
    // let highestBid = ethers.utils.formatEther(await simpleAuction.highestBid.call());
    // expect(highestBid).to.equal('2.0');
  });

  it("Should return corrected gas price", async function () {
    const [bider1] = await ethers.getSigners();
    let bidValue = BigNumber.from('1');
    let balanceBeforeBid = await ethers.provider.getBalance(bider1.address);
    // console.log('balanceBeforeBid ... ', ethers.utils.formatEther(balanceBeforeBid));
    
    //Start bid
    let tx = await simpleAuction.bid({
      from: bider1.address,
      value: bidValue
    });
    
    //Calculate gas fee
    let block = await ethers.provider.getBlock(tx.blockNumber);
    let gasUsed = block.gasUsed;
    let gasPrice = await tx.gasPrice;
    let gasFee = gasUsed.mul(gasPrice);
    
    let balanceAfterBid = await ethers.provider.getBalance(bider1.address);
    let sumOfExpense = balanceAfterBid.add(gasFee).add(bidValue);
    // console.log('sumOfExpense ... ', ethers.utils.formatEther(sumOfExpense));

    expect(balanceBeforeBid).to.equal(sumOfExpense);
  });

  it("Should fail when bid after auction time end already", async function () {
    const [bider1] = await ethers.getSigners();

    //Advance Time & end auction
    await timeMachine.advanceTimeAndBlock(simpleAuction.provider, 600)
    await simpleAuction.auctionEnd();
    
    //Bid after auction time end
    await expect(
      simpleAuction.bid({
        from: bider1.address,
        value: ethers.utils.parseEther("1")})
    ).to.be.revertedWith('AuctionAlreadyEnded()');

  });

  it("Should fail when end auction before auction end time", async function () {
    let auctionEndTime = await simpleAuction.auctionEndTime.call();
    // console.log('auctionEndTime... ', auctionEndTime.toNumber());
    await expect(simpleAuction.auctionEnd()).to.be.revertedWith('AuctionNotYetEnded()');
  });

  xit("Should end auction success after time end, then assign beneficiary to highest bider", async function () {
    let auctionEndTime = await simpleAuction.auctionEndTime.call();
    // console.log('auctionEndTime... ', auctionEndTime.toNumber());

    const [bider1, bider2] = await ethers.getSigners();
    
    //First bid
    let tx1 = await simpleAuction.bid({
      from: bider1.address,
      value: ethers.utils.parseEther("1")
    });
    
    //Second bid
    let tx2 = await simpleAuction.connect(bider2).bid({
      from: bider2.address,
      value: ethers.utils.parseEther("2")
    });

    //Check time before time travel
    let blockNo = await ethers.provider.getBlockNumber();
    let block = await ethers.provider.getBlock(blockNo);
    let blockTimestamp = block.timestamp;
    // console.log('blockTimestamp before... ', blockTimestamp);

    // let blockTimestamp2 = (await ethers.provider.getBlock("latest")).timestamp;
    // console.log('blockTimestamp before... ', blockTimestamp2);

    //Advance Time
    let advanceTimeAndBlock = await timeMachine.advanceTimeAndBlock(simpleAuction.provider, 600)
    // let advanceTimeAndBlock = await  simpleAuction.provider.send("evm_mine", [time]);

    //Check time after time travel
    blockNo = await ethers.provider.getBlockNumber();
    block = await ethers.provider.getBlock(blockNo);
    blockTimestamp = block.timestamp;
    // console.log('blockTimestamp after... ', blockTimestamp);

    //End auction
    let tx3 = await simpleAuction.auctionEnd();

    expect(tx3).to.not.be.empty;
    expect(tx3).to.not.be.null;
    expect(await simpleAuction.highestBidder.call()).to.equal(bider2.address);
  });
  
});
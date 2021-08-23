// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;
contract SimpleAuction {
    address payable public beneficiary;
    uint256 public auctionEndTime;
    address public highestBidder;
    uint256 public highestBid;
    // mapping(address => uint256) pendingReturns;
    mapping(address => uint256) public pendingReturns;
    bool ended;

    event HighestBidIncreased(address bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);
    
    error AuctionAlreadyEnded();
    error BidNotHighEnough(uint256 highestBid);
    error AuctionNotYetEnded();
    error AuctionEndAlreadyCalled();

    constructor(uint256 _biddingTime, address payable _beneficiary) {
        beneficiary = _beneficiary;
        auctionEndTime = block.timestamp + _biddingTime;
    }
    function bid() public payable {
        if (block.timestamp > auctionEndTime) revert AuctionAlreadyEnded();
        if (msg.value <= highestBid) revert BidNotHighEnough(highestBid);
        if (highestBid != 0) {
            pendingReturns[highestBidder] += highestBid;
        }
        highestBidder = msg.sender;
        highestBid = msg.value;
        emit HighestBidIncreased(msg.sender, msg.value);
    }
    function withdraw() public returns (bool) {
        uint256 amount = pendingReturns[msg.sender];
        if (amount > 0) {
            pendingReturns[msg.sender] = 0;
            if (!payable(msg.sender).send(amount)) {
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }
    function auctionEnd() public {
        if (block.timestamp < auctionEndTime) revert AuctionNotYetEnded();
        if (ended) revert AuctionEndAlreadyCalled();
        ended = true;
        emit AuctionEnded(highestBidder, highestBid);
        beneficiary.transfer(highestBid);
    }
}
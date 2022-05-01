//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {

    uint256 public constant TOKEN_PRICE = 0.001 ether;

    uint public constant TOKEN_PER_NFT = 10 * 10**18;

    uint public constant MAX_TOTAL_SUPPLY = 10000 * 10**18;

    ICryptoDevs CryptoDevNFT;

    mapping(uint256 => bool) public tokenIdClaimed;

    constructor (address _CryptoDevAddress) ERC20("Crypto Dev Token", "CD") {
        CryptoDevNFT = ICryptoDevs(_CryptoDevAddress);
    }

    function mint(uint256 amount) public payable {
        
        uint _requiredAmountPrice = TOKEN_PRICE * amount;
        
        require(msg.value >= _requiredAmountPrice, "Ether sent for the transaction is incomplete");

        uint256 amountOfTokenInDecimal = amount * 10**18;

        require((totalSupply() + amountOfTokenInDecimal) <= MAX_TOTAL_SUPPLY, "Youve exceed the maximum token available");

        _mint(msg.sender, amountOfTokenInDecimal);
    }


    function claim() public {

        address sender = msg.sender;

        uint256 balance = CryptoDevNFT.balanceOf(sender);

        require(balance > 0, "You dont owned any Crypto Dev NFT");

        uint256 amount = 0;

          for(uint x = 0; x < balance; x++ )  {

              uint256 tokenId = CryptoDevNFT.tokenOfOwnerByIndex(sender, x);

              if(!tokenIdClaimed[tokenId]){
                  amount += 1;
                  tokenIdClaimed[tokenId] = true;
              }
          }

        require(amount > 0, "You have already claimed all the NFT free tokens");
        
        _mint(sender, amount * TOKEN_PER_NFT);  
   
    }

    receive() external payable {}

    fallback() external payable {}


}
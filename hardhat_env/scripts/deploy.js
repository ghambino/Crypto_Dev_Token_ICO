const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

const { CRYPTO_DEV_NFT_ADDRESS } = require("../constants");


const main = async () => {
    
  const nftCollectionAddress = CRYPTO_DEV_NFT_ADDRESS;

  const tokenIcoContract = await ethers.getContractFactory("CryptoDevToken");

  const deployedIcoContract = await tokenIcoContract.deploy(
    nftCollectionAddress
  );

  console.log("CryptoDev Token Contract Address:", deployedIcoContract.address);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

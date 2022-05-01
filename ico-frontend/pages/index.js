import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  ICO_CONTRACT_ABI,
  ICO_CONTRACT_ADDRESS,
} from "../constants";
import { utils, Contract, providers, BigNumber } from "ethers";
import styles from "../styles/Home.module.css";

export default function Home() {
  //create a zero number using BigNumber.from function
  const zero = BigNumber.from(0);
  //set state to check if wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  //track if a transaction, or page is loading or not
  const [loading, setLoading] = useState(false);
  //track the number of token the current user is eligible to claim
  //based on the number of crypto Dev NFT owned in user address
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  //total number of ICO token currently present in the user address
  const [balanceOfCryptoDevToken, setBalanceOfCryptoDevToken] = useState(zero);
  //value accepted from the input interface indicating how many token you want to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  //current balance of the ICO token (10,000 - totalMinted)
  const [tokenMinted, setTokenMinted] = useState(zero);
  //reference to web3 wallet injectors
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      //ascetain your on the rinkeby network
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 4) {
        window.alert("Change network to Rinkeby");
        throw new Error("Change network to Rinkeby");
      }
      //check if signer is true
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }

      return web3Provider;
    } catch (err) {
      console.error(err.message);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err.message);
    }
  };

  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const icoContractInstance = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        provider
      );
      const totalMint = await icoContractInstance.totalSupply();
      setTokenMinted(totalMint);
    } catch (err) {
      console.error(err);
    }
  };

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContractInstance = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const ICOContractInstance = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();

      const nftBalance = await nftContractInstance.balanceOf(address);
      console.log(nftBalance)

      if (nftBalance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        let amount = 0;
        for (let x = 0; x < nftBalance; x++) {
          const tokenId = await nftContractInstance.tokenOfOwnerByIndex(
            address,
            x
          );
          const claimed = await ICOContractInstance.tokenIdClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }

        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {}
  };

  const getBalanceOfCryptoDevToken = async () => {
    try {
      const provider = await getProviderOrSigner();
      const ICOContractInstance = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        provider
      );
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();

      const tokenBalance = await ICOContractInstance.balanceOf(address);

      setBalanceOfCryptoDevToken(tokenBalance);
    } catch (err) {
      console.error(err.message);
    }
  };

  const mintCryptoDevToken = async (amount) => {
    try {
      //write transaction
      const signer = await getProviderOrSigner(true);
      const ICOContractInstance = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        signer
      );

      const value = 0.001 * amount;
      
      const tx = await ICOContractInstance.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);

      await tx.wait();

      setLoading(false);

      window.alert(`You have successfully minted ${amount} Crypto Dev Tokens`);
      await getBalanceOfCryptoDevToken();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err.message);
    }
  };

  const claimCryptoDevTokens = async () => {
    try {
      //write function
      const signer = await getProviderOrSigner(true);
      const ICOContractInstance = new Contract(
        ICO_CONTRACT_ADDRESS,
        ICO_CONTRACT_ABI,
        signer
      );
      const tx = await ICOContractInstance.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You have successfully claimed all your Crypto Dev Token");
      await getBalanceOfCryptoDevToken();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err.message);
    }
  };

 

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevToken();
      getTokensToBeClaimed();
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading........</button>
        </div>
      );
    }

    if(tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed for free!!!!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            onChange={({ target }) =>
              setTokenAmount(BigNumber.from(target.value))
            }
            className={styles.input}
          />
        </div>
        <button className={styles.button} onClick={() => mintCryptoDevToken(tokenAmount) } disabled={(tokenAmount <= 0)}>
          Mint Tokens
        </button>
      </div>
    );
  };

  console.log(tokensToBeClaimed)

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfCryptoDevToken)}{" "}
                Crypto Dev Tokens
              </div>
              <div className={styles.description}>
                Overall {utils.formatEther(tokenMinted)}/ 10000 have been
                minted!!! Hurry up
              </div>
              {renderButton()}
            </div>
          ) : (
            <div>
              <button className={styles.button} onClick={connectWallet}>
                Connect your wallet
              </button>
            </div>
          )}
        </div>
        <div>
          <img
            className={styles.image}
            src="/0.svg"
            placeholder="crypto developers"
            layout="fill"
          />
        </div>
      </div>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}

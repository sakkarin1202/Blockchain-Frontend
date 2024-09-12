"use client";
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Chip,
  Stack,
  Container,
  Card,
  CardContent,
  TextField,
  Box,
  IconButton,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { ethers, formatEther, parseUnits } from "ethers";
import { initializeConnector } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";
import abi from "./abi.json";

const [metaMask, hooks] = initializeConnector(
  (actions) => new MetaMask({ actions })
);
const { useChainId, useAccounts, useIsActive, useProvider } = hooks;
const contractChain = 11155111;
const contractAddress = "0xff4934b7c7fb1cc70e49f29515672af8c649010f";

const getAddressTxt = (str, s = 6, e = 6) => {
  return str ? `${str.slice(0, s)}...${str.slice(str.length - e)}` : "";
};

export default function Page() {
  const chainId = useChainId();
  const accounts = useAccounts();
  const isActive = useIsActive();
  const provider = useProvider();
  const [balance, setBalance] = useState("");
  const [ETHValue, setETHValue] = useState(0);
  const [error, setError] = useState(undefined);

  useEffect(() => {
    const fetchBalance = async () => {
      if (provider && accounts[0]) {
        try {
          const signer = provider.getSigner(accounts[0]);
          const smartContract = new ethers.Contract(
            contractAddress,
            abi,
            signer
          );
          const myBalance = await smartContract.balanceOf(accounts[0]);
          setBalance(formatEther(myBalance));
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
      }
    };
    if (isActive) fetchBalance();
  }, [isActive, accounts, provider]);

  const handleBuy = async () => {
    if (ETHValue <= 0) return;
    try {
      const signer = provider.getSigner(accounts[0]);
      const balance = await provider.getBalance(accounts[0]);
      const weiValue = parseUnits(ETHValue.toString(), "ether");
      if (balance.lt(weiValue)) {
        setError("Insufficient funds for this transaction.");
        return;
      }
      const smartContract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await smartContract.buy({ value: weiValue.toString() });
      console.log("Transaction hash:", tx.hash);
    } catch (error) {
      console.error("Transaction failed:", error);
      setError("Transaction failed");
    }
  };

  useEffect(() => {
    void metaMask.connectEagerly().catch(() => {
      console.debug("Failed to connect eagerly to MetaMask");
    });
  }, []);

  const handleConnect = () => {
    metaMask.activate(contractChain);
  };

  const handleDisconnect = () => {
    metaMask.resetState();
    alert(
      "Please remove this site from MetaMask's connected sites to fully disconnect."
    );
  };

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              SakkarinToken
            </Typography>

            {!isActive ? (
              <Button variant="contained" onClick={handleConnect}>
                Connect Wallet
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Chip label={getAddressTxt(accounts[0])} variant="outlined" />
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </Stack>
            )}
          </Toolbar>
        </AppBar>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 2 }}>
        {isActive && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography>UDS</Typography>
                <TextField label="Address" value={accounts[0]} readOnly />
                <TextField label="UDS Balance" value={balance} readOnly />
                <Divider />
                <Typography>Buy UDS (1 ETH = 10 UDS)</Typography>
                <TextField
                  label="ETH"
                  type="number"
                  onChange={(e) => setETHValue(e.target.value)}
                />
                <Button variant="contained" onClick={handleBuy}>
                  Buy
                </Button>
                {error && <Typography color="error">{error}</Typography>}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>
    </div>
  );
}

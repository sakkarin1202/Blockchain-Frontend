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
import Swal from "sweetalert2";
import Image from "next/image";
import ethImage from "/public/eth.png";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet"; 
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"; 
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn"; 

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

      // SweetAlert เมื่อซื้อสำเร็จ
      Swal.fire({
        title: "Transaction Successful!",
        text: `You Buy successfully ${ETHValue} ETH.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      setError("Transaction failed");

      // SweetAlert เมื่อซื้อไม่สำเร็จ
      Swal.fire({
        title: "Transaction Failed!",
        text: "Something went wrong during the transaction.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
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
    Swal.fire({
      title: "Are you sure?",
      text: "You will be disconnected from the wallet.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, disconnect it!",
    }).then((result) => {
      if (result.isConfirmed) {
        metaMask.resetState();
        Swal.fire("Disconnected!", "You have been disconnected.", "success");
      }
    });
  };

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="static"
          sx={{
            backgroundColor: "#4A90E2",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
          }}
        >
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
              <Button
                variant="contained"
                onClick={handleConnect}
                sx={{
                  backgroundColor: "#00C853",
                  color: "white",
                  boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.2)",
                }}
              >
                Connect Wallet
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Chip
                  label={getAddressTxt(accounts[0])}
                  variant="outlined"
                  sx={{ color: "#4A90E2", borderColor: "#4A90E2" }}
                />
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={handleDisconnect}
                  sx={{
                    backgroundColor: "#F44336",
                    color: "white",
                    boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  Disconnect
                </Button>
              </Stack>
            )}
          </Toolbar>
        </AppBar>
      </Box>

      <Container
        maxWidth="false"
        sx={{
          p: 0,
          height: "100vh",
          mt: 1,
          background: "linear-gradient(135deg, #e0f7fa 30%, #e1bee7 70%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {!isActive && (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <Image
              src={ethImage}
              alt="Ethereum"
              layout="fill"
              objectFit="cover"
            />
            <Typography
              variant="h5"
              sx={{
                color: "#4A90E2",
                fontWeight: "bold",
                position: "absolute",
                textAlign: "center",
                zIndex: 1,
              }}
            ></Typography>
          </Box>
        )}

        {isActive && (
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.1)",
              maxWidth: 500,
              width: '50%',
              margin: "20px auto", 
              background: "linear-gradient(45deg, #00C4FF, #4A90E2, #8E44AD)",
              mt: 0,
            }}
          >
            <CardContent>
              <Stack spacing={2}>
                <Typography
                  variant="h5"
                  sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}
                >
                  UDS Balance
                </Typography>
                <TextField
                  label="Address"
                  value={accounts[0]}
                  readOnly
                  sx={{ backgroundColor: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}
                  InputProps={{
                    sx: { fontSize: "0.9rem" },
                  }}
                />
                <TextField
                  label="UDS Balance"
                  value={balance}
                  readOnly
                  sx={{ backgroundColor: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}
                  InputProps={{
                    sx: { fontSize: "0.9rem" },
                  }}
                />
                <Divider />
                <Typography
                  variant="h6"
                  sx={{ color: "white", fontWeight: "bold", textAlign: "center" }}
                >
                  <AttachMoneyIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                  Buy UDS (1 ETH = 10 UDS)
                </Typography>
                <TextField
                  label="ETH"
                  type="number"
                  onChange={(e) => setETHValue(e.target.value)}
                  sx={{ backgroundColor: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}
                  InputProps={{
                    sx: { fontSize: "0.9rem" },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleBuy}
                  sx={{
                    backgroundColor: "#00C853",
                    color: "white",
                    boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                  Buy
                </Button>
                {error && <Typography color="error">{error}</Typography>}
                
                {/* เพิ่มไอคอนเหรียญ */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <MonetizationOnIcon sx={{ fontSize: 40, color: "#FFD700", mr: 1 }} />
                  <Typography variant="h6" sx={{ color: "white" }}>
                    1 ETH = 10 UDS
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Container>
    </div>
  );
}

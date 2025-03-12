import React, { useEffect, useState } from 'react'

const Connector = () => {
    const [provider, setProvider] = useState(null);
    const [accounts, setAccounts] = useState([])
    const [chainId, setChainId] = useState('')
    const [isConnected, setIsConnected] = useState(false)

    const MAINNET_CHAIN_ID = "0x1" // Ethereum Mainnet
    const SEPOLIA_CHAIN_ID = "0xaa36a7" // Sepolia Testnet

    useEffect(() => {
        if (window.ethereum) {
            setProvider(window.ethereum)
        }
    }, []) // Add empty dependency array to run only once

    // Set up event listeners
    useEffect(() => {
        if (!provider) return;

        // Event handlers
        const handleAccountsChanged = (accounts) => {
            console.log("Accounts changed:", accounts)
            if (accounts.length > 0) {
                setAccounts(accounts)
                setIsConnected(true)
            } else {
                setAccounts([])
                setIsConnected(false)
            }
        }

        const handleChainChanged = (chainId) => {
            console.log("Chain changed:", chainId)
            setChainId(chainId)
        }

        // Set up listeners
        provider.on("accountsChanged", handleAccountsChanged)
        provider.on("chainChanged", handleChainChanged)

        // Cleanup function
        return () => {
            if (provider.removeListener) {
                provider.removeListener("accountsChanged", handleAccountsChanged)
                provider.removeListener("chainChanged", handleChainChanged)
            }
        }
    }, [provider]) // run again when provider changes

    // Connect wallet
    async function connect() {
        if (!provider) return;
        
        try {
            const result = await provider.request({
                method: "eth_requestAccounts"
            })
            setAccounts(result)
            setIsConnected(true)
            
            const currentChainId = await provider.request({
                method: "eth_chainId"
            })
            setChainId(currentChainId)
            
            console.log("Connected:", result)
        } catch (error) {
            console.log("Connection error:", error)
        }
    }

    // Switch between Ethereum and Sepolia
    const toggleChain = async () => {
        if (!provider) return;
        
        try {
            const targetChainId = chainId === SEPOLIA_CHAIN_ID ? MAINNET_CHAIN_ID : SEPOLIA_CHAIN_ID
            
            await provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: targetChainId }]
            })
            
            console.log(`Switching to ${targetChainId === MAINNET_CHAIN_ID ? "Ethereum Mainnet" : "Sepolia Testnet"}`)
        } catch (error) {
            console.log("Error switching chain:", error)
            
            // If chain doesn't exist, suggest adding it
            if (error.code === 4902) {
                console.log("Chain not available, please add it first")
            }
        }
    }

    // Add chain function
    async function addChain() {
        if (!provider) return;
        
        try {
            await provider.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: "0x1388",
                        chainName: "Mantle",
                        rpcUrls: ["https://rpc.mantle.xyz"],
                        nativeCurrency: {
                            name: "Mantle",
                            symbol: "MNT",
                            decimals: 18
                        },
                        blockExplorerUrls: ["https://mantlescan.xyz"]
                    }
                ]
            })
            console.log("Mantle network added")
        } catch (error) {
            console.log("Error adding chain:", error)
        }
    }

    // Transfer function (0.001 Sepolia ETH)
    async function transferAccount() {
        if (!provider || accounts.length === 0) return;
        
        if (chainId !== SEPOLIA_CHAIN_ID) {
            console.log("Please switch to Sepolia network first")
            return
        }
        
        try {
            const tx = await provider.request({
                method: "eth_sendTransaction",
                params: [{
                    from: accounts[0],
                    to: "0x5b522A979ea2a5121b651756CD4274C92386f8C2",
                    value: "0x38D7EA4C68000"
                }]
            })
            console.log("Transaction sent:", tx)
        } catch (error) {
            console.log("Transaction error:", error)
        }
    }

    // Disconnect function
    async function disconnect() {
        if (!provider) return
        
        // Reset state since we can't really disconnect
        setAccounts([])
        setChainId('')
        setIsConnected(false)
        console.log("Disconnected")
    }

    const getNetworkName = (id) => {
        switch (id) {
            case MAINNET_CHAIN_ID:
                return "Ethereum Mainnet"
            case SEPOLIA_CHAIN_ID:
                return "Sepolia Testnet"
            case "0x1388":
                return "Mantle"
            default:
                return "Unknown Network"
        }
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 my-8">
            <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">EIP-1193 Wallet Connector</h2>
            
            <div className="grid grid-cols-2 gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md" onClick={connect}>Connect Wallet</button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-md" onClick={toggleChain}>
                {chainId === SEPOLIA_CHAIN_ID ? "Switch to Ethereum" : "Switch to Sepolia"}
            </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-md" onClick={addChain}>Add Mantle Chain</button>
            <button className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-md" onClick={transferAccount}>Transfer</button>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md w-full" onClick={disconnect}>Disconnect</button>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
            {isConnected && (
                <div>
                    <h3>Connection Details</h3>
                    <p>Connected Account: {accounts[0]}</p>
                    <p>Network: {getNetworkName(chainId)} ({chainId})</p>
                </div>
            )}
            </div>
        </div>
    )
}

export default Connector
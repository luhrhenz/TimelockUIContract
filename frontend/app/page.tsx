"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther, formatEther } from "viem";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/config";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [lockDays, setLockDays] = useState("7");
  const [depositTimestamp, setDepositTimestamp] = useState<number>(0);

  const { data: vaultData, refetch: refetchVault } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getVault",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { writeContract: deposit, data: depositHash } = useWriteContract();
  const { writeContract: withdraw, data: withdrawHash } = useWriteContract();

  const { isLoading: isDepositLoading, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const vault = vaultData
    ? {
        amount: formatEther(vaultData[0]),
        unlockTime: Number(vaultData[1]),
        active: vaultData[2],
      }
    : null;

  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  useEffect(() => {
    if (isDepositSuccess || isWithdrawSuccess) {
      refetchVault();
    }
  }, [isDepositSuccess, isWithdrawSuccess, refetchVault]);

  // Store deposit timestamp when vault data loads
  useEffect(() => {
    if (vault && vault.active && vault.unlockTime > 0 && depositTimestamp === 0) {
      // Estimate deposit time based on unlock time and typical lock period
      // This is a fallback - ideally we'd store this when depositing
      const now = Math.floor(Date.now() / 1000);
      const remaining = vault.unlockTime - now;
      if (remaining > 0) {
        // Assume typical lock period of 7 days if we can't determine
        setDepositTimestamp(vault.unlockTime - (7 * 24 * 60 * 60));
      }
    }
  }, [vault, depositTimestamp]);

  // Force re-render every minute to update progress bar
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Refetch vault when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      refetchVault();
    }
  }, [isConnected, address, refetchVault]);

  const handleDeposit = () => {
    if (!depositAmount) return;
    const unlockTime = Math.floor(Date.now() / 1000) + Number(lockDays) * 86400;
    setDepositTimestamp(Math.floor(Date.now() / 1000));
    deposit({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "deposit",
      args: [BigInt(unlockTime)],
      value: parseEther(depositAmount),
    });
  };

  const handleWithdraw = () => {
    withdraw({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "withdraw",
    });
  };

  const isUnlocked = vault && vault.active && now / 1000 >= vault.unlockTime;
  const isLoading = isDepositLoading || isWithdrawLoading;

  // Calculate time remaining and progress
  const getTimeRemaining = () => {
    if (!vault || !vault.active) return null;
    const remaining = vault.unlockTime * 1000 - now;
    if (remaining <= 0) return { days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  };

  // Calculate progress percentage
  const getProgress = () => {
    if (!vault || !vault.active || vault.unlockTime === 0) return 0;
    const currentTime = Math.floor(now / 1000);
    const totalLockPeriod = vault.unlockTime - depositTimestamp;
    if (totalLockPeriod <= 0) return 100;
    const elapsed = currentTime - depositTimestamp;
    const progress = (elapsed / totalLockPeriod) * 100;
    return Math.min(100, Math.max(0, progress));
  };
  const timeRemaining = getTimeRemaining();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="border-b border-[#1f1f2e] bg-[#0d0d14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xl font-bold">TimeLock</span>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#1a1a2e] rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-4">Lock Your ETH</h1>
              <p className="text-gray-400 mb-8">
                Secure your Ethereum and earn rewards. Connect your wallet to get started.
              </p>
              <ConnectButton showBalance={false} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Vault Card */}
            <div className="lg:col-span-2 space-y-6">
              {vault && vault.active ? (
                <>
                  {/* Vault Status */}
                  <div className="bg-[#111118] border border-[#1f1f2e] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Your Vault</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isUnlocked 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#0d0d14] rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1">Locked Amount</p>
                        <p className="text-3xl font-bold text-white">{vault.amount}</p>
                        <p className="text-gray-500 text-sm">ETH</p>
                      </div>
                      <div className="bg-[#0d0d14] rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1">Unlock Date</p>
                        <p className="text-xl font-semibold text-white">
                          {new Date(vault.unlockTime * 1000).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {new Date(vault.unlockTime * 1000).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {/* Time Remaining */}
                    {timeRemaining && !isUnlocked && (
                      <div className="bg-[#0d0d14] rounded-xl p-4 mb-6">
                        <p className="text-gray-400 text-sm mb-3">Time Remaining</p>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">{timeRemaining.days}</p>
                            <p className="text-xs text-gray-500">Days</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">{timeRemaining.hours}</p>
                            <p className="text-xs text-gray-500">Hours</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">{timeRemaining.minutes}</p>
                            <p className="text-xs text-gray-500">Minutes</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-gray-400">
                          {vault.unlockTime > 0 
                            ? Math.min(100, Math.max(0, (1 - (vault.unlockTime * 1000 - Date.now()) / (Number(lockDays) * 86400 * 1000)) * 100)).toFixed(0)
                            : 0}%
                          </span>
                      </div>
                      <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: isUnlocked ? '100%' : `${getProgress()}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleWithdraw}
                      disabled={!isUnlocked || isLoading}
                      className={`w-full py-4 rounded-xl font-semibold transition-all ${
                        isUnlocked && !isLoading
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-[#1a1a2e] text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Processing...' : isUnlocked ? 'Withdraw ETH' : 'Locked'}
                    </button>
                  </div>

                  {/* Transaction History Placeholder */}
                  <div className="bg-[#111118] border border-[#1f1f2e] rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    <div className="text-center py-8 text-gray-500">
                      <p>No transactions yet</p>
                    </div>
                  </div>
                </>
              ) : (
                /* Create Vault */
                <div className="bg-[#111118] border border-[#1f1f2e] rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-6">Create New Vault</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Amount (ETH)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0d0d14] border border-[#1f1f2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
                          placeholder="0.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">ETH</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Lock Duration
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[7, 14, 30, 90].map((days) => (
                          <button
                            key={days}
                            onClick={() => setLockDays(days.toString())}
                            className={`py-3 rounded-xl font-medium transition-all ${
                              lockDays === days.toString()
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#0d0d14] text-gray-400 hover:bg-[#1a1a2e]'
                            }`}
                          >
                            {days}D
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={lockDays}
                        onChange={(e) => setLockDays(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0d0d14] border border-[#1f1f2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
                        placeholder="Custom days"
                      />
                    </div>

                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || isLoading}
                      className="w-full py-4 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Lock ETH'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-[#111118] border border-[#1f1f2e] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Protocol Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Value Locked</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Vaults</span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className="bg-[#111118] border border-[#1f1f2e] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">How it Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-sm">1</span>
                    </div>
                    <p className="text-gray-400 text-sm">Deposit ETH and choose lock period</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-sm">2</span>
                    </div>
                    <p className="text-gray-400 text-sm">Your ETH is locked securely</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-sm">3</span>
                    </div>
                    <p className="text-gray-400 text-sm">Withdraw after lock period</p>
                  </div>
                </div>
              </div>

              {/* Contract Info */}
              <div className="bg-[#111118] border border-[#1f1f2e] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Contract</h3>
                <div className="text-xs text-gray-500 break-all">
                  <p className="mb-1">Address:</p>
                  <p className="text-gray-400 font-mono">{CONTRACT_ADDRESS}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

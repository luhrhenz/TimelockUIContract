import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia} from 'wagmi/chains';
import { rabbyWallet, metaMaskWallet, rainbowWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';

// Get WalletConnect project ID from env, or use fallback for build
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE';

export const config = getDefaultConfig({
  appName: 'TimeLock Savings',
  projectId: projectId,
  chains: [sepolia],
  ssr: false,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [rabbyWallet, metaMaskWallet, rainbowWallet, walletConnectWallet],
    },
  ],
});

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;

// Reward token address
export const REWARD_TOKEN_ADDRESS = '0xD1148d8A9299D39d79110Dde3e10266bc47a220E' as `0x${string}`;

export const CONTRACT_ABI = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'payable',
    inputs: [{ name: 'unlockTime', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getVault',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'unlockTime', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'totalActiveVaults',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'rewardToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'REWARD_RATE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { name: 'user', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'unlockTime', type: 'uint256', indexed: false },
      { name: 'rewards', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

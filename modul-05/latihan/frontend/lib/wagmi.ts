import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { cookieStorage, createStorage, http } from 'wagmi';
import { mainnet, sepolia, base } from 'wagmi/chains';

export const anvilTestnet = defineChain({
  id: 31337,
  name: 'Anvil Testnet',
  testnet: true,
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Anvil Testnet Explorer',
      url: 'http://localhost:8545',
    },
  },
  iconUrl: '',
});


export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  testnet: true,
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Base Sepolia Explorer',
      url: 'https://base-sepolia.blockscout.com',
    },
  },
  iconUrl: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
});

// Add iconUrl to built-in chains
const mainnetWithIcon = {
  ...mainnet,
  iconUrl: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
};

const sepoliaWithIcon = {
  ...sepolia,
  iconUrl: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
};

const baseWithIcon = {
  ...base,
  iconUrl: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
};

export const config = getDefaultConfig({
  appName: 'PBALend',
  projectId: '1',
  chains: [anvilTestnet, mainnetWithIcon, sepoliaWithIcon, baseWithIcon, baseSepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [anvilTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

import { createConfig } from "ponder";

import { PBA_LEND_ABI } from "./abis/PBALendAbi";

export default createConfig({
  chains: {
    baseSepolia: {
      id: 84532,
      rpc: process.env.RPC_URL!,
    },
  },
  contracts: {
    PBALend: {
      chain: "baseSepolia",
      abi: PBA_LEND_ABI,
      address: process.env.PBA_LEND as `0x${string}`,
      startBlock: Number(process.env.START_BLOCK),
    },
  },
});

export const tokens = {
    "0xe5d18330f15b4174c7a3be036f79d8d2ee1b4986": {
        name: "USDC",
        symbol: "USDC",
        address: "0xe5d18330f15b4174c7a3be036f79d8d2ee1b4986",
        decimals: 6,
        image: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042194",
        price: 1
    },
    "0xbc0f217636e3cfd41d07a06d0c23e267c4c48bca": {
        name: "DAI",
        symbol: "DAI",
        address: "0xbc0f217636e3cfd41d07a06d0c23e267c4c48bca",
        decimals: 18,
        image: "https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png?1696509996",
        price: 1
    },
    "0x4ae66956f3889d06dc6ecfc0ea56ace8ca339652": {
        name: "BTC",
        symbol: "BTC",
        address: "0x4ae66956f3889d06dc6ecfc0ea56ace8ca339652",
        decimals: 8,
        image: "https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png?1696507857",
        price: 113000
    },
    "0x398134cbd4592f2925abf72869f992d0cfc595e5": {
        name: "ETH",
        symbol: "ETH",
        address: "0x398134cbd4592f2925abf72869f992d0cfc595e5",
        decimals: 18,
        image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
        price: 4200
    },
}

export const getToken = (address: string | undefined | null) => {
    // Check if address is null, undefined, or empty
    if (!address || typeof address !== 'string') {
        console.warn(`⚠️ Invalid address provided to getToken:`, address);
        return {
            name: "Unknown Token",
            symbol: "UNKNOWN",
            address: address || "",
            decimals: 18,
            image: "",
            price: 0
        };
    }

    const token = tokens[address.toLowerCase() as keyof typeof tokens];
    
    if (!token) {
        console.warn(`⚠️ Token not found for address: ${address}`);
        return {
            name: "Unknown Token",
            symbol: "UNKNOWN",
            address: address,
            decimals: 18,
            image: "",
            price: 0
        };
    }
    
    return token;
}
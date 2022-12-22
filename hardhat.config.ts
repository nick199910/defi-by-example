import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { any } from "hardhat/internal/core/params/argumentTypes";
dotenv.config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL_HTTP1;
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;

const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY;
const ETHMAIN_RPC_URL: string = process.env.ETHMain_RPC_URL_HTTP || "";
const ETHMAIN_PRIVATE_KEY = process.env.ETHMAIN_PRIVATE_KEY;
const ETHMAIN_RPC_QUICKNODE_URL = process.env.ETHMain_RPC_URL_HTTP1 || "";

const config: HardhatUserConfig = {
    solidity: "0.8.17",

    networks: {
        localhost: {
            // chainId: 31337,
            url: "http://127.0.0.1:8545",
            // mining: {
            //     auto: true,
            //     interval: 5000,
            // },
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: GOERLI_PRIVATE_KEY ? [GOERLI_PRIVATE_KEY] : [],
            chainId: 5,
        },
        main: {
            url: ETHMAIN_RPC_URL,
            accounts: ETHMAIN_PRIVATE_KEY ? [ETHMAIN_PRIVATE_KEY] : [],
            chainId: 1,
        },
        hardhat: {
            forking: {
                url: ETHMAIN_RPC_QUICKNODE_URL,
            },
        },
    },
};

export default config;

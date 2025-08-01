require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

// INFURA_API_KEY = 59e997192bc0411cbbfc6dc242db2596
// 0xFAF1F37fA31CC417d1f16Cf117ddB58696B3E223
// POLYGONSCAN_KEY = 5a20daa52d78a517d323f74b5c7cdc9715a82aab6ec11cd2435d6ac5e94a203f

// const POLYGON_KEY = process.env.POLYGONSCAN_KEY;
// const PRIVATE_KEY = process.env.INFURA_API_KEY;



module.exports = {
  defaultNetwork: "polygon_amoy",
  networks: {
    hardhat: {
    },
    polygon_amoy: {
      url: `https://polygon-amoy.infura.io/v3/59e997192bc0411cbbfc6dc242db2596`,
      accounts: [`5a20daa52d78a517d323f74b5c7cdc9715a82aab6ec11cd2435d6ac5e94a203f`]
    }
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
}

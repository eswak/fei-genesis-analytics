const fs = require('fs');
const ganache = require('ganache-core');
const Web3 = require('web3');
const web3 = new Web3(require('../config.json')['infura-wss']);
const keccak256 = require('keccak256');
const genesisAbi = require('../contracts/Genesis.json').abi;
const genesisAddress = require('../contracts/Genesis.json').address;
const genesisContract = new web3.eth.Contract(genesisAbi, genesisAddress);

(async () => {
  const BLOCK_START = 12148927;
  const BLOCK_STEP = 100;
  const BLOCK_END = 12225000;
  var genesisParticipants = {};
  for (var blockStart = BLOCK_START; blockStart < BLOCK_END; blockStart += BLOCK_STEP) {
    console.log('Fetch FEI Protocol genesis participants...', Math.round((blockStart - BLOCK_START) / (BLOCK_END - BLOCK_START) * 10000) / 100, '%');

    // Purchase
    await genesisContract.getPastEvents('Purchase', {
      fromBlock: blockStart,
      toBlock: blockStart + BLOCK_STEP
    })
    .then(function(events){
      events.forEach((event) => {
        const address = event.returnValues[0];
        const ethCommited = Number(event.returnValues[1]) / 1e18;
        genesisParticipants[address] = genesisParticipants[address] || { ethGenesis: 0, ethPreswap: 0 };
        genesisParticipants[address].ethGenesis += ethCommited;
      });
    })
    .catch(function(e) { throw new Error(e) });

    // Commit
    await genesisContract.getPastEvents('Commit', {
      fromBlock: blockStart,
      toBlock: blockStart + BLOCK_STEP
    })
    .then(function(events){
      events.forEach((event) => {
        const address = event.returnValues[0];
        const preswapEth = Number(event.returnValues[2]) / 1e18;
        genesisParticipants[address] = genesisParticipants[address] || { ethGenesis: 0, ethPreswap: 0 };
        genesisParticipants[address].ethPreswap += preswapEth;
      });
    })
    .catch(function(e) { throw new Error(e) });
  }
  console.log(Object.keys(genesisParticipants).length, 'unique genesis participant addresses.');
  var totalEth = 0;
  var totalPreswap = 0;
  for (var key in genesisParticipants) {
    totalEth += genesisParticipants[key].ethGenesis;
    totalPreswap += genesisParticipants[key].ethPreswap;
    genesisParticipants[key].preswap = Math.floor(genesisParticipants[key].ethPreswap / genesisParticipants[key].ethGenesis * 100) / 100;
  }
  console.log('Total ETH commited to Genesis :', totalEth);
  console.log('Total ETH preswapped :', totalPreswap);

  fs.writeFileSync(__dirname + '/../output/genesis-participants.json', JSON.stringify(genesisParticipants), 'utf8');
  console.log('end');
})().catch(e => {
  console.log('Unhandled rejection :');
  console.log(e);
});

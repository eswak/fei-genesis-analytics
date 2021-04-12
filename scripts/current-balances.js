const fs = require('fs');
const ganache = require('ganache-core');
const Web3 = require('web3');
const web3 = new Web3(require('../config.json')['infura-wss']);
const keccak256 = require('keccak256');

const genesisAbi = require('../contracts/Genesis.json').abi;
const genesisAddress = require('../contracts/Genesis.json').address;
const genesisContract = new web3.eth.Contract(genesisAbi, genesisAddress);
const uniPoolFeiTribeAbi = require('../contracts/UniswapPool_FEI-TRIBE.json').abi;
const uniPoolFeiTribeAddress = require('../contracts/UniswapPool_FEI-TRIBE.json').address;
const uniPoolFeiTribe = new web3.eth.Contract(uniPoolFeiTribeAbi, uniPoolFeiTribeAddress);
const stakingFeiTribeAbi = require('../contracts/Staking_FEI-TRIBE.json').abi;
const stakingFeiTribeAddress = require('../contracts/Staking_FEI-TRIBE.json').address;
const stakingFeiTribe = new web3.eth.Contract(stakingFeiTribeAbi, stakingFeiTribeAddress);
const feiTokenAbi = require('../contracts/Token_FEI.json').abi;
const feiTokenAddress = require('../contracts/Token_FEI.json').address;
const feiToken = new web3.eth.Contract(feiTokenAbi, feiTokenAddress);
const tribeTokenAbi = require('../contracts/Token_TRIBE.json').abi;
const tribeTokenAddress = require('../contracts/Token_TRIBE.json').address;
const tribeToken = new web3.eth.Contract(tribeTokenAbi, tribeTokenAddress);

(async () => {
  const genesisParticipants = require('../output/genesis-participants.json');

  const poolTotalSupply = await uniPoolFeiTribe.methods.totalSupply().call() / 1e18;
  const poolReserves = await uniPoolFeiTribe.methods.getReserves().call();
  const poolFei = poolReserves[0] / 1e18;
  const poolTribe = poolReserves[1] / 1e18;
  const nParticipants = Object.keys(genesisParticipants).length;

  var i = 0;
  console.log('Fetch current balance for', nParticipants, 'genesis participants...');
  for (var address in genesisParticipants) {
    console.log('Fetch genesis participants current balance...', Math.round(i / nParticipants * 10000) / 100, '%');

    const feiBalance = await feiToken.methods.balanceOf(address).call() / 1e18;
    const tribeBalance = await tribeToken.methods.balanceOf(address).call() / 1e18;
    const poolTokensBalance = await uniPoolFeiTribe.methods.balanceOf(address).call() / 1e18;
    const poolTokensStaking = await stakingFeiTribe.methods.balanceOf(address).call() / 1e18;
    const stakingUnclaimedTribe = await stakingFeiTribe.methods.earned(address).call() / 1e18;

    const fei = feiBalance + (poolTokensBalance + poolTokensStaking) / poolTotalSupply * poolFei;
    const tribe = tribeBalance + (poolTokensBalance + poolTokensStaking) / poolTotalSupply * poolTribe + stakingUnclaimedTribe;

    genesisParticipants[address].fei = fei || 0;
    genesisParticipants[address].tribe = tribe || 0;
    i++;
  }

  fs.writeFileSync(__dirname + '/../output/current-balances.json', JSON.stringify(genesisParticipants), 'utf8');
  console.log('end');
})().catch(e => {
  console.log('Unhandled rejection :');
  console.log(e);
});

async function erc20info(address) {
  return {
    name: await ethCall(address, 'name()', 'string'),
    symbol: await ethCall(address, 'symbol()', 'string'),
    decimals: await ethCall(address, 'decimals()', 'number')
  };
}

async function ethCall(to, fname, type) {
  var ret = await web3.eth.call({ to: to, data: keccak256(fname).toString('hex').substring(0, 8) });
  if (type === 'string') {
    ret = web3.utils.hexToString(ret);
    ret = ret.replace(/[\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000A\u000B\u000C\u000D\u000E\u000F]+/g, '');
    ret = ret.replace(/[\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F]+/g, '');
    ret = ret.replace(/\n/g, '');
    ret = ret.replace(/.?\x08/g, '');
    ret = ret.trim();
  } else if (type === 'number') {
    ret = web3.utils.hexToNumber(ret);
  }
  return ret;
}

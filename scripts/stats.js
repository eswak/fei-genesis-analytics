const fs = require('fs');
const plt = require('matplotnode');
const data = require(__dirname + '/../output/genesis-participants.json');
var stats = { test: true };

var genesisEth = 639235.59;
var genesisFeiPerEth = 2058.35;
var genesisFeiPerTribeSwap = 3.236;
var genesisAirdropTribePerEth = 156.5;
var genesisPreswapTribePerEth = 629.5;

for (var key in data) {
  var d = data[key];
  d.genesisFeiBalance = (d.ethGenesis - d.ethPreswap) * genesisFeiPerEth;
  d.genesisTribeBalance = (d.ethGenesis) * genesisAirdropTribePerEth + d.ethPreswap * genesisPreswapTribePerEth;
  d.fei = Math.random() * 2 * d.genesisFeiBalance;
  d.tribe = Math.random() * 2 * d.genesisTribeBalance;
}

(async () => {
  // =================================================================================================
  var cummulativeEth = initData('Cummulative ETH contributed to Genesis', Math.round);
  for (var key in data) {
    var d = data[key];
    cummulativeEth[bucket(d)] += d.ethGenesis;
  }
  cummulativeEth.print();

  // =================================================================================================
  var cummulativeEthVsPreswap = initData('Cummulative ETH contributed to Genesis', Math.round, function() {
    return [
      ' 0-33  %preswap',
      '33-67  %preswap',
      '67-100 %preswap'
    ];
  });
  for (var key in data) {
    var d = data[key];
    var bucketIndex = d.preswap < 0.33 ? 0 : d.preswap < 0.67 ? 1 : 2;
    cummulativeEthVsPreswap[bucketIndex] += d.ethGenesis;
  }
  cummulativeEthVsPreswap.print();

  // =================================================================================================
  var averagePreswap = initData('Average preswap during Genesis (weighted by contribution)', (x) => (Math.round(x * 10000) / 100 + '%'));
  for (var key in data) {
    var d = data[key];
    averagePreswap[bucket(d)] += d.ethPreswap;
  }
  buckets().forEach(function(bucket, i) {
    averagePreswap[i] = averagePreswap[i] / cummulativeEth[i];
  });
  averagePreswap.print();

  // =================================================================================================
  var categories = ['  <20%', '20-80%', '80-100%', ' >100%'];
  var hodling = initData('TRIBE owned vs TRIBE given at genesis (weighted by contribution)', function(arr, i) {
    if (i === 0) {
      console.log('              ', categories.join(' | '));
    }
    return arr.map((y, j) => {
      var str = Math.round(y * 10000) / 100 + '%';
      while (str.length < categories[j].length) str = ' ' + str;
      return str;
    }).join(' | ');
  });
  for (var key in data) {
    var d = data[key];
    if (hodling[bucket(d)] === 0) hodling[bucket(d)] = [0, 0, 0, 0];
    var hodl = d.tribe / d.genesisTribeBalance;
    var i = hodl < 0.2 ? 0 : hodl <= 0.8 ? 1 : hodl > 1 ? 3 : 2;
    hodling[bucket(d)][i] += d.ethGenesis;
  }
  buckets().forEach(function(bucket, i) {
    hodling[i].forEach(function(val, j) {
      hodling[i][j] /= cummulativeEth[i];
    });
  });
  hodling.print();

  // =================================================================================================
  var categories = ['  <20%', '20-80%', '80-100%', ' >100%'];
  var hodlingVsPreswap = initData('TRIBE owned vs TRIBE given at genesis (weighted by contribution)', function(arr, i) {
    if (i === 0) {
      console.log('                 ', categories.join(' | '));
    }
    return arr.map((y, j) => {
      var str = Math.round(y * 10000) / 100 + '%';
      while (str.length < categories[j].length) str = ' ' + str;
      return str;
    }).join(' | ');
  }, function() {
    return [
      ' 0-33  %preswap',
      '33-67  %preswap',
      '67-100 %preswap'
    ];
  });
  for (var key in data) {
    var d = data[key];
    var bucketIndex = d.preswap < 0.33 ? 0 : d.preswap < 0.67 ? 1 : 2;
    if (hodlingVsPreswap[bucketIndex] === 0) hodlingVsPreswap[bucketIndex] = [0, 0, 0, 0];
    var hodl = d.tribe / d.genesisTribeBalance;
    var i = hodl < 0.2 ? 0 : hodl <= 0.8 ? 1 : hodl > 1 ? 3 : 2;
    hodlingVsPreswap[bucketIndex][i] += d.ethGenesis;
  }
  [
    ' 0-33  %preswap',
    '33-67  %preswap',
    '67-100 %preswap'
  ].forEach(function(bucket, i) {
    hodlingVsPreswap[i].forEach(function(val, j) {
      hodlingVsPreswap[i][j] /= cummulativeEthVsPreswap[i];
    });
  });
  hodlingVsPreswap.print();

  // =================================================================================================
  fs.writeFileSync(__dirname + '/../output/stats.json', JSON.stringify(stats), 'utf8');
  console.log('end');
})().catch(e => {
  console.log('Unhandled rejection :');
  console.log(e);
});

function initData(title, transform, bucketsFn) {
  bucketsFn = bucketsFn || buckets;
  var data = bucketsFn().map(() => 0);
  transform = transform || ((x) => x);
  data.print = function() {
    console.log('');
    console.log(title);
    bucketsFn().forEach(function(bucket, i) {
      console.log(bucket, ':', transform(data[i], i));
    });
  };
  return data;
}

function buckets() {
  return [
    '< 5 ETH     ',
    '5-50 ETH    ',
    '50-500 ETH  ',
    '500-5000 ETH',
    '>= 5000 ETH '
  ];
}

function bucket(d) {
  if (d.ethGenesis < 5) return 0;
  if (d.ethGenesis < 50) return 1;
  if (d.ethGenesis < 500) return 2;
  if (d.ethGenesis < 5000) return 3;
  return 4;
}

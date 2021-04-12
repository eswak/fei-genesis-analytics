## Fei Protocol Genesis event analytics
How to use :
- Install dependencies `npm install`
- Replace the url to your infura node in `config.json`
- Run `node scripts/genesis-participants.js` to create `output/genesis-participants.json`
- Run `node scripts/current-balances.js` to create `output/current-balances.json` (must have fetched genesis participants first, to enrich that dataset with current balances)
- Run `node scripts/stats.js` to display some stats.

Code is dirty, but the good news is, you can run your own code to further analyze `output/current-balances.json` ;-)

You can also find a `data.json` on this repository, containing data from a run on the 2021-04-12.

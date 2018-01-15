const fetch = require('node-fetch')
const fs    = require('fs')

if (process.argc < 3) {
  console.error(`usage: node p holdingsFile.json <optional currency string>`)
  process.exit(1)
}
const sHoldingsFile = process.argv[2];
const oHoldings     = JSON.parse(fs.readFileSync(sHoldingsFile).toString())
let   sCurrency     = 'USD'
if (process.argc > 3) {
  sCurrency = process.argv[3]
}
// https://coinmarketcap.com/api/
// "AUD", "BRL", "CAD", "CHF", "CLP", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PKR", "PLN", "RUB", "SEK", "SGD", "THB", "TRY", "TWD", "ZAR"

// example holdings file
// {
//   "bat":          { "coins": 14794.20400000,  "name": "basic-attention-token" }
//   "cbit":         { "coins": 141073.78463412, "name": "c-bit"                 }
//   "daxx":         { "coins": 94418.44881665,  "name": "daxxcoin"              }
//   "electroneum":  { "coins": 5337.43899816,   "name": "electroneum"           }
//   "macron":       { "coins": 56590.28363494,  "name": "macron"                }
// }


// see https://coinmarketcap.com/api/ for details
const sBaseUrl = 'https://api.coinmarketcap.com/v1/ticker'

const fPortfolio = async (holdings) => {
  let aPromises = []
  for (let i in holdings) {
    const oHolding = holdings[i]
    const sUrl = sCurrency === 'USD' ? `${sBaseUrl}/${oHolding.name}/` : `${sBaseUrl}/${oHolding.name}/?convert=${sCurrency}`
    const fget = async (sUrl) => {
      const res   = await fetch(sUrl)
      const aData = await res.json()
      return Array.isArray(aData) && aData.length === 1 ? aData[0] : null
    }
    aPromises.push(fget(sUrl))
  }
  const aHolding = Object.keys(holdings)
  const aResults = await Promise.all(aPromises)
  // console.log(aResults)
  if (aResults.length != aHolding.length) {
    throw Error(`portfolio holdings length ${aHolding.length} mismatch to response dimensions ${aResults.length}`)
  }
  let oPortfolio = {}
  let balance = 0;
  for (let i in aHolding) {
    const asset       = aHolding[i]
    const oHolding    = holdings[asset]
    const oPriceData  = aResults[i]
    const sPriceKey   = `price_${sCurrency.toLowerCase()}`
    const price       = parseFloat(oPriceData[sPriceKey])
    const val         = oHolding.coins * price
    // console.log('asset',asset,'oHolding',oHolding,'oPriceData',oPriceData,'sPriceKey',sPriceKey,'price',price,'val',val)
    oPortfolio[asset] = { coins: oHolding.coins, price: price, value: val }
    balance          += val
  }
  oPortfolio.balance = balance
  return oPortfolio
}

fPortfolio(oHoldings)
.then( oPortfolio => {
  console.log(oPortfolio)
})
.catch( err => {
  console.error(err);
})


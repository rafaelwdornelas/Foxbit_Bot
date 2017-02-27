const variables = require('./variables')
const index = require('./index.js');
module.exports = [
{
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {path: 'static',listing: true}
  }
},
{ //get page
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply.file('./static/ws_client.html');
  }
},
{
  method: 'GET',
  path: '/stats',
  handler: function (request, reply) {
    var buy = variables.TradeLimits.BUY.active == false ? "Not" : "Yes";
    var sell = variables.TradeLimits.SELL.active == false ? "Not" : "Yes";
    var profit = variables.TradeLimits.PROFIT.active == false ? "Not" : "Yes";
    reply(JSON.stringify({ sell: sell, buy: buy, profit: profit})).code(200).type('application/json').header('Connection', 'keep-alive').header('Cache-Control', 'no-cache');
  } 
},
{
  method: 'GET',
  path: '/getBalance',
  handler: function (request, reply) {
    var BRL_locked = "";
    var BTC_locked = "";
    if (variables.infoBalanceBRL.BRL_locked > 0) {BRL_locked = "-"+parseFloat(variables.infoBalanceBRL.BRL_locked / 1e8).toFixed(2)}
    if (variables.infoBalanceBRL.BTC_locked > 0) {BTC_locked = "-"+parseFloat(variables.infoBalanceBRL.BTC_locked / 1e8).toFixed(6)}
    reply(JSON.stringify({ BRL: parseFloat(variables.infoBalanceBRL.BRL / 1e8).toFixed(2)+BRL_locked, BTC: parseFloat(variables.infoBalanceBRL.BTC / 1e8).toFixed(6)+BTC_locked, ClientID: variables.ClientID })).code(200).type('application/json').header('Connection', 'keep-alive').header('Cache-Control', 'no-cache');
  } 
},
{
  method: 'GET',
  path: '/getorderbook',
  handler: function (request, reply) {
    reply(JSON.stringify(variables.orderbooktemp)).code(200).type('application/json').header('Connection', 'keep-alive').header('Cache-Control', 'no-cache');
  } 
},
{
  method: 'GET',
  path: '/getledger',
  handler: function (request, reply) {
    reply(JSON.stringify(variables.ledgertemp['LedgerListGrp'])).code(200).type('application/json').header('Connection', 'keep-alive').header('Cache-Control', 'no-cache');
  } 
},
{
  method: 'GET',
  path: '/getorders',
  handler: function (request, reply) {
    reply(JSON.stringify(variables.orderstemp)).code(200).type('application/json').header('Connection', 'keep-alive').header('Cache-Control', 'no-cache');
  } 
},
{
  method: 'POST',
  path: '/buy',
  handler: function (request, reply) {
      const POST = request.payload
      if (variables.TradeLimits.BUY.active == false) {
          variables.TradeLimits.BUY.active = true;
          variables.TradeLimits.BUY.min = POST.btcbuypriceamountmin;
          variables.TradeLimits.BUY.max = POST.btcbuypriceamountmax;
          variables.TradeLimits.BUY.amount = POST.btcbuyamount;
          index.VerifyChangesExports();
      } else {
          variables.TradeLimits.BUY.active = false;
          variables.TradeLimits.BUY.min = 0;
          variables.TradeLimits.BUY.max = 0;
          variables.TradeLimits.BUY.amount = 0;
          index.VerifyChangesExports();
      }
    const response = reply('You Post buy to Hapi')
    response.header('Content-Type', 'text/plain')
  }
},
{
  method: 'POST',
  path: '/buysell',
  handler: function (request, reply) {
      const POST = request.payload
      if (variables.TradeLimits.BUY.active == false) {
          variables.TradeLimits.BUY.active = true;
          variables.TradeLimits.PROFIT.active = true;
          variables.TradeLimits.BUY.min = POST.btcbuypriceamountmin;
          variables.TradeLimits.BUY.max = POST.btcbuypriceamountmax;
          variables.TradeLimits.BUY.amount = POST.btcbuyamount;
          variables.TradeLimits.PROFIT.amount = POST.btcbuysellpriceprofit;
          index.VerifyChangesExports();
      } else {
          variables.TradeLimits.BUY.active = false;
          variables.TradeLimits.PROFIT.active = false;
          variables.TradeLimits.BUY.min = 0;
          variables.TradeLimits.BUY.max = 0;
          variables.TradeLimits.BUY.amount = 0;
          index.VerifyChangesExports();
      }
    const response = reply('You Post buy to Hapi')
    response.header('Content-Type', 'text/plain')
  }
},
{
  method: 'POST',
  path: '/sell',
  handler: function (request, reply) {
      const POST = request.payload
      if (variables.TradeLimits.SELL.active == false) {
          variables.TradeLimits.SELL.active = true;
          variables.TradeLimits.SELL.min = POST.btcsellpriceamountmin;
          variables.TradeLimits.SELL.max = POST.btcsellpriceamountmax;
          variables.TradeLimits.SELL.amount = POST.btcsellamount;
          index.VerifyChangesExports();
      } else {
          variables.TradeLimits.SELL.active = false;
          variables.TradeLimits.SELL.min = 0;
          variables.TradeLimits.SELL.max = 0;
          variables.TradeLimits.SELL.amount = 0;
          index.VerifyChangesExports();
      }
    const response = reply(`You Post Sell to Hapi`)
    response.header('Content-Type', 'text/plain')
  }
}
];


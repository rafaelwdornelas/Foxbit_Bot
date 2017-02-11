//Import packages
var dateFormat = require('dateformat');
var pjson = require('./package.json');
var config = require('./config.json');
var http = require('http');
const path = require('path');
var fs = require('fs');
var open = require('open');
var BlinkTradeWS = require("blinktrade").BlinkTradeWS;
var blinktrade = new BlinkTradeWS({ 
  prod: true,
  currency: config.currency,
  brokerId: config.brokerId,
 });

//Declaration of Variables
var ClientID ='';
var orderbooktemp = [];
var LedgerIDs = {FOX: 0};
var ledgertemp = [];
var orderstemp = [];
var Bestorder = {bids: 0,asks: 0};
var enableorder = {bids: false,asks: false};
var TradeLimits = {
						BUY: {
              active: false, //There is an active order
							min: 0.0, //Minimum purchase value
							max: 0.0, //Maximum purchase value
							amount: 0.0, //Total bitcoin value for purchase
              OrderID: 0,
              ClOrdID: 0 
							},
						SELL: {
              active: false, //There is an active order
              min: 0.0, //Minimum value for sale
							max: 0.0, //Maximum value for sale
							amount: 0.0, //Total bitcoin value for sale
              OrderID: 0,
              ClOrdID: 0 
							}
					 };
var infoBalanceBRL = {BRL: 0,BTC: 0};


//clear console
process.stdout.write('\x1Bc');
//Welcome screen
console.log("Description:",pjson.description);
console.log("Version:",pjson.version);
console.log("*******************************************************");

var server = http.createServer( function(req, res, next) {
	if (req.method == 'POST') {
    var body = '';
    req.on('data', function (data) {
      body += data;
      var POST = {};
      body = body.split('&');
      for (var i = 0; i < body.length; i++) {
        var _body = body[i].split("=");
        POST[_body[0]] = _body[1];
      }
      console.log(POST);
      if(req.url=='/buy') {
        console.log("POST Buy");
        if (TradeLimits.BUY.active == false) {
          TradeLimits.BUY.active = true;
          TradeLimits.BUY.min = POST.btcbuypriceamountmin;
          TradeLimits.BUY.max = POST.btcbuypriceamountmax;
          TradeLimits.BUY.amount = POST.btcbuyamount;
        } else {
          TradeLimits.BUY.active = false;
          TradeLimits.BUY.min = 0;
          TradeLimits.BUY.max = 0;
          TradeLimits.BUY.amount = 0;
          myOrdersList_Remove("1");
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ activeNodes: 10 }));
      } else if (req.url=='/sell') {
        console.log("POST Sell");
        if (TradeLimits.SELL.active == false) {
          TradeLimits.SELL.active = true;
          TradeLimits.SELL.min = POST.btcsellpriceamountmin;
          TradeLimits.SELL.max = POST.btcsellpriceamountmax;
          TradeLimits.SELL.amount = POST.btcsellamount;
        } else {
          TradeLimits.SELL.active = false;
          TradeLimits.SELL.min = 0;
          TradeLimits.SELL.max = 0;
          TradeLimits.SELL.amount = 0;
          myOrdersList_Remove("2");
        }
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ activeNodes: 10 }));
        }
      });
      req.on('end', function () {});
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('post received');
  } else {
    if(req.url=='/') {
			console.log("Send Page Home");
      var html = fs.readFileSync('static/ws_client.html');
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    } else if (req.url=='/stats') {
    	res.writeHead(200, {'Content-Type': 'application/json'});
      var buy = TradeLimits.BUY.active == false ? "Not" : "Yes";
      var sell = TradeLimits.SELL.active == false ? "Not" : "Yes";
    	res.end(JSON.stringify({ sell: sell, buy: buy}));
    } else if (req.url=='/getBalance') {
      res.writeHead(200, {'Content-Type': 'application/json'});
    	res.end(JSON.stringify({ BRL: parseFloat(infoBalanceBRL.BRL / 1e8).toFixed(2), BTC: parseFloat(infoBalanceBRL.BTC / 1e8).toFixed(6), ClientID: ClientID }));
		} else if (req.url=='/getorderbook') {
    	res.writeHead(200, {'Content-Type': 'application/json'});
    	res.end(JSON.stringify(orderbooktemp));
    } else if (req.url=='/getledger') {
    	res.writeHead(200, {'Content-Type': 'application/json'});
    	res.end(JSON.stringify(ledgertemp['LedgerListGrp']));
    } else if (req.url=='/getorders') {
    	res.writeHead(200, {'Content-Type': 'application/json'});
    	res.end(JSON.stringify(orderstemp));
    } else {
      var filePath = '.' + req.url;
      var extname = path.extname(filePath);
      switch (extname) {
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.png':
          contentType = 'image/png';
          break;      
        case '.jpg':
          contentType = 'image/jpg';
          break;
        case '.wav':
          contentType = 'audio/wav';
          break;
      }
      getStaticFileContent(res, filePath, contentType);
    }
  }
});

function getStaticFileContent(response, filepath, contentType) {
    fs.readFile(filepath, function(error, data){
      if(error) {
        response.writeHead(500,{'Content-Type':'text/plain'});
        response.end('500 - Internal Server Error');
      }
      if(data) {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(data);
      } else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
        }
    });
}


server.listen(3000);
console.log('Listening at http://127.0.0.1:3000');
open('http://127.0.0.1:3000');

//String repeat protection
var lastLog;
function logConsole(str) {
	if (lastLog != str) {
		lastLog = str;
		//change color replace
		str = str.replace('[', '\x1b[93m['); //Yellow color
		str = str.replace(']', ']\x1b[0m');  //Reset color
		str = str.replace('<@', '\x1b[92m'); //Green color
		str = str.replace('@>', '\x1b[0m');  //Reset color
		str = str.replace('<#', '\x1b[91m'); //Green color
		str = str.replace('#>', '\x1b[0m');  //Reset color
		console.log(str);
	}
}

//Server Latency
blinktrade.connect(["BLINK:BTCBRL"]).then(function() {
  // Connected
  return blinktrade.login({ username: config.key, password: config.password });
}).then(function(logged) {
  //Read changes orders
  blinktrade.executionReport()
  .on('EXECUTION_REPORT:NEW', onNew)
  .on('EXECUTION_REPORT:PARTIAL', onPartial)
  .on('EXECUTION_REPORT:EXECUTION', onExecution)
  .on('EXECUTION_REPORT:CANCELED', onCanceled)
  .on('EXECUTION_REPORT:REJECTED', onRejected);


  //Start Server Latency
  setInterval(Latency, 5000);
  //Start Balance
  Balance()
  setInterval(Balance, 30000);
  //Start Get Orderbook
  orderbook()
  setInterval(orderbook, 3000);
  // Start Ledger
  requestLedger()
  setInterval(requestLedger, 3000); 
  // Start Open Orders
  myorders() 
  setInterval(myorders, 2000); 

  
  
}).catch(function(err) {
  console.log(err);
})
 
 //Get Latency Server
function Latency() {
  blinktrade.heartbeat().then(function(heartbeat) {
    logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Server Latency: " + heartbeat.Latency);
  });
}
//Print result New Order
function onNew(data) {
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit New Order:");
  var Side = data.Side = "1" ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.AvgPx * data.OrderQty / 1e16).toFixed(2));
  logConsole("***************************************************");
}
//Print result Order Partially Executed
function onPartial(data) {
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Partially Executed:");
  var Side = data.Side = "1" ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.AvgPx * data.OrderQty / 1e16).toFixed(2));
  logConsole("***************************************************");
}
//Print result Order Executed
function onExecution(data) {
  console.log(data)
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Executed:");
  var Side = data.Side = "1" ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.AvgPx * data.OrderQty / 1e16).toFixed(2));
  logConsole("***************************************************");
  //Enable New Orders
  if (Side == "Buy") {
    TradeLimits.BUY.OrderID = 0;
    TradeLimits.BUY.ClOrdID = 0;
  } else {
    TradeLimits.SELL.OrderID = 0;
    TradeLimits.SELL.ClOrdID = 0;
  }
}
//Print result Order Cancelled
function onCanceled(data) {
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Cancelled:");
  var Side = data.Side = "1" ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.AvgPx * data.OrderQty / 1e16).toFixed(2));
  logConsole("***************************************************");
  //Enable New Orders
  if (Side == "Buy") {
    TradeLimits.BUY.OrderID = 0;
    TradeLimits.BUY.ClOrdID = 0;
  } else {
    TradeLimits.SELL.OrderID = 0;
    TradeLimits.SELL.ClOrdID = 0;
  }
}
//Print result Order Rejected
function onRejected(data) {
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Rejected:");
  var Side = data.Side = "1" ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.AvgPx * data.OrderQty / 1e16).toFixed(2));
  logConsole("***************************************************");
  //Enable New Orders
  if (Side == "Buy") {
    TradeLimits.BUY.OrderID = 0;
    TradeLimits.BUY.ClOrdID = 0;
  } else {
    TradeLimits.SELL.OrderID = 0;
    TradeLimits.SELL.ClOrdID = 0;
  }
}

//get balance
function Balance() {
  try {
    blinktrade.balance().then(function(balance) {
      if(typeof balance.Available.BRL != "undefined" && balance.Available.BRL != null){
        infoBalanceBRL.BRL = balance.Available.BRL;
        infoBalanceBRL.BTC = balance.Available.BTC;
        ClientID = balance.ClientID;
        logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Balance: " + parseFloat(balance.Available.BRL / 1e8).toFixed(2)  + " BRL | " + parseFloat(balance.Available.BTC / 1e8).toFixed(6)  + " BTC@>");
      }
    });
  } catch (err) {
    console.log("Balance GET", err)
  }
}


//get orderbook
function orderbook() {
  try {
    blinktrade.subscribeOrderbook(["BTCBRL"]).then(function(orderbook) {
      orderbooktemp = orderbook['MDFullGrp']['BTCBRL'];
      //Print changes values in orderbook
      if (Bestorder.bids != parseFloat(orderbooktemp['bids'][0][0]) || Bestorder.asks != parseFloat(orderbooktemp['asks'][0][0])) {
        logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Bests Order Book: Buy: " + Bestorder.bids  + " BRL | Sell: " + Bestorder.asks  + " BRL");
      }
      //Capture bids y asks values
      Bestorder.bids = parseFloat(orderbooktemp['bids'][0][0]);
      Bestorder.asks = parseFloat(orderbooktemp['asks'][0][0]);
      var currentidbids = parseFloat(orderbooktemp['bids'][0][2]);
      var currentidasks = parseFloat(orderbooktemp['asks'][0][2]);
      //Buy Active Check
      if (TradeLimits.BUY.active == true) {
        //Check if the last order made is different from the first order book Buy
				if (currentidbids != ClientID && Bestorder.bids < parseFloat(Bestorder.asks - 0.01)) {
          //New value Calc
          var valuenew = Bestorder.bids + 0.01;
          if (TradeLimits.BUY.min > valuenew ) {
            valuenew = TradeLimits.BUY.min
          }
          if (TradeLimits.BUY.max < valuenew ) {
            valuenew = TradeLimits.BUY.max
          }  
          if (TradeLimits.BUY.OrderID == 0) {
            enableorder.bids = true;
            SendOrderBuy(valuenew)
            return
          }
          if (enableorder.bids == true) {
            if (TradeLimits.BUY.min > Bestorder.bids + 0.01 || TradeLimits.BUY.max < Bestorder.bids + 0.01) {return}
            logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "]\x1b[91m Change bests order book BRL \x1b[0m")
            deleteOrder(TradeLimits.BUY.OrderID,TradeLimits.BUY.ClOrdID);
          }
          

        } else if ((parseFloat(orderbooktemp['bids'][0][0]) - 0.01).toFixed(2) > parseFloat(orderbooktemp['bids'][1][0])) {
          if (TradeLimits.BUY.min > Bestorder.bids + 0.01 || TradeLimits.BUY.max < Bestorder.bids + 0.01) {return}
  				 deleteOrder(TradeLimits.BUY.OrderID,TradeLimits.BUY.ClOrdID);
  			}
      }
      if (TradeLimits.SELL.active == true) {
			  if (currentidasks != ClientID && Bestorder.bids < parseFloat(Bestorder.asks + 0.01)) {
          //New value Calc
          var valuenew = Bestorder.bids - 0.01;
          if (TradeLimits.SELL.min > valuenew ) {
            valuenew = TradeLimits.SELL.min
          }
          if (TradeLimits.SELL.max < valuenew ) {
            valuenew = TradeLimits.SELL.max
          }
          if (TradeLimits.SELL.OrderID == 0) {
            enableorder.asks = true;
            SendOrderSell(valuenew)
            return
          }
          if (enableorder.asks == true) {
            if (TradeLimits.SELL.min > Bestorder.asks - 0.01 || TradeLimits.SELL.max < Bestorder.asks - 0.01) {return}
            logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "]\x1b[91m Change bests order book BRL \x1b[0m")
            deleteOrder(TradeLimits.SELL.OrderID,TradeLimits.SELL.ClOrdID);
          }
        } else if ((parseFloat(orderbooktemp['asks'][0][0]) + 0.01).toFixed(2) < parseFloat(orderbooktemp['asks'][1][0])) {
          if (TradeLimits.SELL.min > Bestorder.asks - 0.01 || TradeLimits.SELL.max < Bestorder.asks - 0.01) {return}
  				deleteOrder(TradeLimits.SELL.OrderID,TradeLimits.SELL.ClOrdID);
  			}
      }
    });
  } catch (err) {
    console.log("Orderbook GET", err)
  }
}



//get Ledger
function requestLedger() {
  try {
    blinktrade.requestLedger().then(function(ledger) {
      if (typeof ledger['LedgerListGrp'][0] == 'undefined') {
        return undefined;
      } else {
        ledgertemp = ledger;
      }
      if (LedgerIDs.FOX == 0) {
        LedgerIDs.FOX = ledger['LedgerListGrp'][0].LedgerID;
      } else if (LedgerIDs.FOX != ledger['LedgerListGrp'][0].LedgerID) {
        for(var i = 0; i < ledger['LedgerListGrp'].length; i++) {
          if (LedgerIDs.FOX == ledger['LedgerListGrp'][i].LedgerID) {
            LedgerIDs.FOX = ledger['LedgerListGrp'][0].LedgerID;
            return
          }
          var Operationx = ledger['LedgerListGrp'][i].Operation = "C" ? 'Credit' : 'Debit';
          logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@FOX Trade Ledger | LedgerID: " + ledger['LedgerListGrp'][i].LedgerID + " | Operation: " + Operationx + " | Amount: " + parseFloat(ledger['LedgerListGrp'][i].Amount / 1e8).toFixed(6) + " " + ledger['LedgerListGrp'][i].Currency + " | Description: " +  switchLedger(ledger['LedgerListGrp'][i].Description) + "@>");
          savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] FOX Trade Ledger | LedgerID: " + ledger['LedgerListGrp'][i].LedgerID + " | Operation: " + Operationx + " | Amount: " + parseFloat(ledger['LedgerListGrp'][i].Amount / 1e8) + " " + ledger['LedgerListGrp'][i].Currency + " | Description: " +  switchLedger(ledger['LedgerListGrp'][i].Description));
        }
        LedgerIDs.FOX = ledger['LedgerListGrp'][0].LedgerID;
      }
    });
  } catch (e) {
    console.log(e);
  }
}


//get orderbook
function myorders() {
  try {
    blinktrade.myOrders().then(function(myOrders) {
      orderstemp = myOrders['OrdListGrp']
    });
  } catch (err) {
    console.log("Orderbook GET", err)
  }
}

function SendOrderBuy(price) {
	if (TradeLimits.BUY.active == false) {
   	return
  }
	var amount = TradeLimits.BUY.amount;
  //Call function to buy the order in exchange
  blinktrade.sendOrder({
		"side": "1", //buy
  	"price": parseInt((price * 1e8).toFixed(0)),
  	"amount": parseInt((amount * 1e8).toFixed(0)),
  	"symbol": "BTCBRL",
		}).then(function(order) {
      enableorder.bids == true;
      TradeLimits.BUY.OrderID = order.OrderID;
      TradeLimits.BUY.ClOrdID = order.ClOrdID ;
      //save log
			savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Purchase: Amount: " + amount + " BTC | Price: " + price + " BRL");
  		//Inform the user
			logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Purchase Order: Amount: " + amount + " BTC | Price: " + price + " BRL@>");
			Balance();
	});
}
function SendOrderSell(price) {
	if (TradeLimits.SELL.active == false) {
   	return
  }
	var amount = TradeLimits.SELL.amount;
  //Call function to buy the order in exchange
  blinktrade.sendOrder({
		"side": "2", //sell
  	"price": parseInt((price * 1e8).toFixed(0)),
  	"amount": parseInt((amount * 1e8).toFixed(0)),
  	"symbol": "BTCBRL",
		}).then(function(order) {
      enableorder.asks == true;
      //save log
			savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Sale: Amount: " + amount + " BTC | Price: " + price + " BRL");
  		//Inform the user
			logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Sale Order: Amount: " + amount + " BTC | Price: " + price + " BRL@>");
			Balance();
	});
}
function deleteOrder(OrderID,ClOrdID) {
	blinktrade.cancelOrder({ orderId: OrderID, clientId: ClOrdID });
}

//Save logs in file log.txt
function savelog(str) {
	var fs = require('fs');
	fs.appendFile('log.txt', str + "\n", function (err) {
  	if (err) {
      // append failed
  	} else {
    	// done
  	}
  });
}
function switchLedger(s) {
  switch(s) {
    case 'B':
      return "Bonus";
    case 'D':
      return "Deposit";
    case 'DF':
      return "Fee on deposit";
    case 'DFC':
      return "Deposit fee referral";
    case 'W':
      return "Withdraw";
    case 'WF':
      return "Fee on withdraw";
    case 'WFC':
      return "Withdrawal fee referral";
    case 'WFR':
      return "Discount on the withdrawal fee";
    case 'WFRV':
      return "Revert withdrawal fee";
    case 'T':
      return "Trade";
    case 'TF':
      return "Fee on trade";
    case 'TFC':
      return "Trade fee referral";
    case 'TFR':
      return "Trade fee refund";
    case 'P':
      return "Point";
    default:
      return s;
  };
}

function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    callback();
}

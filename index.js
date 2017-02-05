//Import packages
var dateFormat = require('dateformat');
var beep = require('beepbeep')
var BlinkTradeRest = require("blinktrade").BlinkTradeRest;
var setTerminalTitle = require('set-terminal-title');
var pjson = require('./package.json');
var config = require('./config.json');
var http = require('http');
var fs = require('fs');
var open = require('open');

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
              active: true, //There is an active order
							min: 0.0, //Minimum purchase value
							max: 0.0, //Maximum purchase value
							amount: 0.0001 //Total bitcoin value for purchase
							},
						SELL: {
              active: false, //There is an active order
              min: 0.0, //Minimum value for sale
							max: 0.0, //Maximum value for sale
							amount: 0.0001 //Total bitcoin value for sale
							}
					 };
var blinktradeFOX = new BlinkTradeRest({
  prod: true,
  key: config.key,
  secret: config.secret,
  currency: config.currency,
  brokerId: config.brokerId,
});
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
            console.log(body);
        });
        req.on('end', function () {});
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('post received');
        if(req.url=='/buy') {
            console.log("POST Buy");
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ activeNodes: 10 }));
        } else if (req.url=='/sell') {
            console.log("POST Sell");
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ activeNodes: 10 }));
        }
    }
    else
    {
      	//console.log(req.url);
    	  if(req.url=='/') {
			       console.log("Send Page Home");
         	   var html = fs.readFileSync('static/ws_client.html');
             // var html = fs.readFileSync('teste.html');
        	   res.writeHead(200, {'Content-Type': 'text/html'});
        	   res.end(html);
    	  } else if (req.url=='/stats') {
    		    //console.log("GET stats");
    		    res.writeHead(200, {'Content-Type': 'application/json'});
            var buy = TradeLimits.BUY.active == false ? "Not" : "Yes";
            var sell = TradeLimits.SELL.active == false ? "Not" : "Yes";
    		    res.end(JSON.stringify({ sell: sell, buy: buy}));
    	  } else if (req.url=='/getBalance') {
            //console.log("GET /getBalance");
            res.writeHead(200, {'Content-Type': 'application/json'});
    		    res.end(JSON.stringify({ BRL: parseFloat(infoBalanceBRL.BRL / 1e8).toFixed(2), BTC: parseFloat(infoBalanceBRL.BTC / 1e8).toFixed(6), ClientID: ClientID }));
		    } else if (req.url=='/getorderbook') {
    		    //console.log("GET /getorderbook");
    		    res.writeHead(200, {'Content-Type': 'application/json'});
    		    res.end(JSON.stringify(orderbooktemp));
    	  } else if (req.url=='/getledger') {
    		    //console.log("GET /getledger");
    		    res.writeHead(200, {'Content-Type': 'application/json'});
    		    res.end(JSON.stringify(ledgertemp['LedgerListGrp']));
    	  } else if (req.url=='/getorders') {
    		    //console.log("GET getledger");
    		    res.writeHead(200, {'Content-Type': 'application/json'});
    		    res.end(JSON.stringify(orderstemp));
    	  } else if (req.url=='/static/js/jquery.js') {
            getStaticFileContent(res, 'static/js/jquery.js','text/js');
        } else if (req.url=='/static/css/bootstrap.min.css') {
            getStaticFileContent(res, 'static/css/bootstrap.min.css','text/css');
        } else if (req.url=='/static/css/client-view.css') {
            getStaticFileContent(res, 'static/css/client-view.css','text/css');
        } else if (req.url=='/static/font-awesome/css/font-awesome.min.css') {
            getStaticFileContent(res, 'static/font-awesome/css/font-awesome.min.css','text/css');
        } else if (req.url=='/static/js/bootstrap.min.js') {
            getStaticFileContent(res, 'static/js/bootstrap.min.js','text/js');
        } else if (req.url=='/static/js/client-view.js') {
            getStaticFileContent(res, 'static/js/client-view.js','text/js');
        } else if (req.url=='/static/js/vendor/flot/jquery.flot.min.js') {
            getStaticFileContent(res, 'static/js/vendor/flot/jquery.flot.min.js','text/js');
        } else if (req.url=='/static/js/vendor/flot/jquery.flot.tooltip.min.js') {
            getStaticFileContent(res, 'static/js/vendor/flot/jquery.flot.tooltip.min.js','text/js');
        } else if (req.url=='/static/css/btcdonate.css') {
            getStaticFileContent(res, 'static/css/btcdonate.css','text/css');
        } else if (req.url=='/static/js/jquery-1.11.0.min.js') {
            getStaticFileContent(res, 'static/js/jquery-1.11.0.min.js','text/js');
        } else if (req.url=='/static/js/jquery.qrcode-0.7.0.min.js') {
            getStaticFileContent(res, 'static/js/jquery.qrcode-0.7.0.min.js','text/js');
        } else if (req.url=='/static/js/btcdonate.js') {
            getStaticFileContent(res, 'static/js/btcdonate.js','text/js');
        } else if (req.url=='/static/img/ico/favicon.ico') {
            getStaticFileContent(res, 'static/img/ico/favicon.ico','image/x-icon');
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

server.listen(3000, '127.0.0.1');
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

//start balance get
Balance()
setInterval(Balance, 30000);
//get balance
function Balance() {
  try {
    blinktradeFOX.balance().then(function(balance) {
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

orderbook()
//start orderbook get one sec
setInterval(orderbook, 2000);
//get orderbook
function orderbook() {
  try {
    blinktradeFOX.orderbook().then(function(orderbook) {
      orderbooktemp = orderbook;
      Bestorder.bids = parseFloat(orderbook['bids'][0][0]);
      Bestorder.asks = parseFloat(orderbook['asks'][0][0]);
      var currentidbids = parseFloat(orderbook['bids'][0][2]);
      var currentidasks = parseFloat(orderbook['asks'][0][2]);
      logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Bests Order Book: Buy: " + Bestorder.bids  + " BRL | Sell: " + Bestorder.asks  + " BRL");
      var market_changed = false;
      //Check if the last order made is different from the first order book Buy
      if (TradeLimits.BUY.active == true) {
        //console.log(currentidbids ,"<>", ClientID,"&&",Bestorder.bids,"<",parseFloat(Bestorder.asks - 0.01))
				if (currentidbids != ClientID && Bestorder.bids < parseFloat(Bestorder.asks - 0.01)) {
					if (enableorder.bids == true) {
						enableorder.bids = false;
            logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "]\x1b[91m Change bests order book BRL \x1b[0m")
            beep(1);
            myOrdersList_Remove("1");
          } else {
						enableorder.bids = true;
            SendOrderBuy(Bestorder.bids + 0.01)
          }
        } else if ((parseFloat(orderbook['bids'][0][0]) - 0.01).toFixed(2) != parseFloat(orderbook['bids'][1][0])) {
  				myOrdersList_Remove("1");
  			}
      }
      if (TradeLimits.SELL.active == true) {
        //console.log(currentidasks ,"<>", ClientID,"&&",Bestorder.bids,"<",parseFloat(Bestorder.asks + 0.01))
			  if (currentidasks != ClientID && Bestorder.bids < parseFloat(Bestorder.asks + 0.01)) {
          if (enableorder.asks == true) {
						enableorder.asks = false;
            logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "]\x1b[91m Change bests order book BRL \x1b[0m")
            beep(1);
            myOrdersList_Remove("2");
          } else {
            enableorder.asks = true;
            SendOrderSell(Bestorder.asks - 0.01)
          }
        } else if ((parseFloat(orderbook['asks'][0][0]) + 0.01).toFixed(2) != parseFloat(orderbook['asks'][1][0])) {
  				myOrdersList_Remove("2");
  			}
      }
    });
  } catch (err) {
    console.log("Orderbook GET", err)
  }
}


function myOrdersList_Remove(type) {
	blinktradeFOX.myOrders().then(function(myOrders) {
		var orderstemp2 = myOrders['OrdListGrp'];
  	var i;
		//Count open orders
		var count = 0;
  	for (i = 0; i < orderstemp.length; i++) {
    	if (orderstemp2[i].OrdStatus =="0") {
      	count++;
    	}
  	}
  	//print Count open orders
  	if (count > 0) {
	    logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Open orders:" + count);
		  logConsole("***************************************************");
      //Scroll through all records
   	  for(i = 0; i < orderstemp.length; i++) {
   	    //Search for open orders
    	  if (orderstemp2[i].OrdStatus =="0" && orderstemp2[i].Side ==  type) {
    	    //Delete order selected
    		 	deleteOrder(orderstemp2[i]);
    	  }
   	  }
		  myOrdersList_Remove(type)
  	} else if (type == "1") {
			enableorder.bids = false;
		} else {
			enableorder.asks = false;
		}
	});
}

requestLedger()
//Call the requestLedgerBRL function refreshing every 3 second.
setInterval(requestLedger, 3000);
function requestLedger() {
  try {
    blinktradeFOX.requestLedger().then(function(ledger) {
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
          beep(3);
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

myorders()
//start orderbook get one sec
setInterval(myorders, 1000);
//get orderbook
function myorders() {
  try {
    blinktradeFOX.myOrders().then(function(myOrders) {
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
  blinktradeFOX.sendOrder({
		"side": "1", //buy
  	"price": parseInt((price * 1e8).toFixed(0)),
  	"amount": parseInt((amount * 1e8).toFixed(0)),
  	"symbol": "BTCBRL",
		}).then(function(order) {
      enableorder.bids == true;
      //save log
			savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Purchase: Amount: " + amount.toFixed(6) + " BTC | Price: " + price.toFixed(2) + " BRL");
  		//Inform the user
			logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Purchase Order: Amount: " + amount.toFixed(6) + " BTC | Price: " + price.toFixed(2) + " BRL@>");
			Balance();
	});
}
function SendOrderSell(price) {
	if (TradeLimits.SELL.active == false) {
   	return
  }
	var amount = TradeLimits.SELL.amount;
  //Call function to buy the order in exchange
  blinktradeFOX.sendOrder({
		"side": "2", //sell
  	"price": parseInt((price * 1e8).toFixed(0)),
  	"amount": parseInt((amount * 1e8).toFixed(0)),
  	"symbol": "BTCBRL",
		}).then(function(order) {
      enableorder.asks == true;
      //save log
			savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Sale: Amount: " + amount.toFixed(6) + " BTC | Price: " + price.toFixed(2) + " BRL");
  		//Inform the user
			logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Sale Order: Amount: " + amount.toFixed(6) + " BTC | Price: " + price.toFixed(2) + " BRL@>");
			Balance();
	});
}
function deleteOrder(myOrders) {
	blinktradeFOX.cancelOrder({ orderID: myOrders.OrderID, clientId: myOrders.ClOrdID }).then(function(order) {
		console.log(order)
    logConsole("***************************************************")
	  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Cancelled:");
	  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Date: " + myOrders.OrderDate);
	  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order OrdStatus: " + myOrders.OrdStatus);
	  var Side = myOrders.Side = "1" ? 'Buy' : 'Sell';
	  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
	  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + myOrders.Symbol);
	  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(myOrders.AvgPx * myOrders.OrderQty / 1e16).toFixed(2));
	  logConsole("***************************************************");
	});
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

function sleep(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms)
  })
}

'use strict';
var dateFormat = require('dateformat');
const open = require('open');
const Hapi = require('hapi');
const Path = require('path');
const Inert = require('inert');
const pjson = require('./package.json');
const config = require('./config.json');
const Routes = require('./routes')
const variables = require('./variables')


//clear console
process.stdout.write('\x1Bc');
//Welcome screen
console.log("Description:",pjson.description);
console.log("Version:",pjson.version);
console.log("*******************************************************");

function serverstart(){
	var server = new Hapi.Server();
	server.connection({ port: 3000, host: 'localhost' });

	server.register([Inert], (err) => {
		if (err)
      console.error('Failed loading plugins');
      //process.exit(1);

    //config routers file in server router    
    server.route(Routes);
 		//start server
 		server.start(() => {
      console.log('Server running at:', server.info.uri);
    		//open page automatic
    		open(server.info.uri);
    	});
  });
}

var BlinkTradeWS = require("blinktrade").BlinkTradeWS;
var blinktrade = new BlinkTradeWS({ 
  prod: true,
  currency: config.currency,
  brokerId: config.brokerId,
});
blinktrade.connect().then(function() {
	return blinktrade.login({ username: config.key, password: config.password });   
}).then(function(logged) {
	console.log("Connected BlinkTradeWS")			
	return blinktrade.balance().on('BALANCE', onBalanceUpdate);
}).then(function(balance) {
	variables.infoBalanceBRL.BRL = balance.Available.BRL;
  variables.infoBalanceBRL.BTC = balance.Available.BTC;
  variables.ClientID = balance.ClientID;
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Balance: " + parseFloat(balance.Available.BRL / 1e8).toFixed(2)  + " BRL | " + parseFloat(balance.Available.BTC / 1e8).toFixed(6)  + " BTC@>");


  blinktrade.executionReport()
  .on('EXECUTION_REPORT:NEW', onExecutionReportNew)
  .on('EXECUTION_REPORT:PARTIAL', onExecutionReportPartial)
  .on('EXECUTION_REPORT:EXECUTION', onExecutionReportExecution)
  .on('EXECUTION_REPORT:CANCELED', onExecutionReportCanceled)
  .on('EXECUTION_REPORT:REJECTED', onExecutionReportRejected);

  return blinktrade.subscribeOrderbook(["BTCBRL"])
  .on('OB:NEW_ORDER', onOrderBookNewOrder)
  .on('OB:UPDATE_ORDER', onOrderBookUpdateOrder)
  .on('OB:DELETE_ORDER', onOrderBookDeleteOrder)
  .on('OB:DELETE_ORDERS_THRU', onOrderBookDeleteThruOrder)
  .on('OB:TRADE_NEW', onOrderBookTradeNew);

}).then(function(orderbook) {
  variables.orderbooktemp = orderbook['MDFullGrp']['BTCBRL'];
  // Start Ledger
  requestLedger()
  setInterval(requestLedger, 3000); 
  // Start Open Orders
  myorders() 
  setInterval(myorders, 2000); 
  serverstart()
});


function onBalanceUpdate(newBalance) {
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + '] Balance Updated');
  var BTC_locked = newBalance['4']['BTC_locked'];
  var BRL_locked = newBalance['4']['BRL_locked'];
  var BTC = newBalance['4']['BTC'];
  var BRL = newBalance['4']['BRL'];
  if (typeof BTC_locked !== 'undefined') {
  	logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] BTC_locked: "+BTC_locked)
  	variables.infoBalanceBRL.BTC_locked = BTC_locked;
  }
  if (typeof BRL_locked !== 'undefined') {
  	logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] BRL_locked: "+BRL_locked)
  	variables.infoBalanceBRL.BRL_locked = BRL_locked;
  }
  if (typeof BTC !== 'undefined') {
  	logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] BTC:"+BTC)
  	variables.infoBalanceBRL.BTC =  parseFloat(BTC / 1e8);
  }
  if (typeof BRL !== 'undefined') {
  	logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] BRL: "+BRL)
  	variables.infoBalanceBRL.BRL =  parseFloat(BRL / 1e8);
  }
}

function onExecutionReportNew(data) {
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit New Order:");
  var Side = data.Side == 1 ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.Price / 1e16).toFixed(6));
  logConsole("***************************************************");
}
function onExecutionReportPartial(data) {
<<<<<<< HEAD
=======
  console.log("onExecutionReportPartial",data)
>>>>>>> 7a282233b12f4d78342b990bd0ab19d3612b93a5
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Partially Executed:");
  var Side = data.Side == 1 ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.Price / 1e16).toFixed(6));
  logConsole("***************************************************");
}
function onExecutionReportExecution(data) {
<<<<<<< HEAD
=======
  console.log("onExecutionReportExecution",data)
>>>>>>> 7a282233b12f4d78342b990bd0ab19d3612b93a5
  var newvalue = data.Price
  newvalue = parseFloat(newvalue / 1e8)
  newvalue = parseFloat((newvalue * (variables.TradeLimits.PROFIT.amount/100))+newvalue)
  if (variables.TradeLimits.PROFIT.active == true) {
    console.log("price",newvalue)
    console.log("amount",data.OrderQty)
    blinktrade.sendOrder({
			"side": "2", //sell
      "price": parseInt(newvalue * 1e8),
      "amount": data.OrderQty,
      "symbol": "BTCBRL",
    }).then(function(order) {
      //save log
			savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating PROFIT: Amount: " + data.OrderQty + " BTC | Price: ");// + valuenew + " BRL");
  		//Inform the user
			logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating PROFIT Order: Amount: " + data.OrderQty + " BTC | Price: ");// + valuenew + " BRL@>");
    });
  }
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Executed:");
  var Side = data.Side == 1 ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.Price / 1e16).toFixed(6));
  logConsole("***************************************************");
  //Enable New Orders
  if (Side == "Buy") {
    variables.TradeLimits.BUY.OrderID = 0;
    variables.TradeLimits.BUY.ClOrdID = 0;
  } else {
    variables.TradeLimits.SELL.OrderID = 0;
    variables.TradeLimits.SELL.ClOrdID = 0;
  }
}
function onExecutionReportCanceled(data) {
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Cancelled:");
  var Side = data.Side == 1 ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.Price / 1e16).toFixed(6));
  logConsole("***************************************************");
  //Enable New Orders
  if (Side == "Buy") {
    variables.TradeLimits.BUY.OrderID = 0;
    variables.TradeLimits.BUY.ClOrdID = 0;
  } else {
    variables.TradeLimits.SELL.OrderID = 0;
    variables.TradeLimits.SELL.ClOrdID = 0;
  }
}

function onExecutionReportRejected(data) {
  console.log("onExecutionReportRejected",data)
  logConsole("***************************************************")
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Order Rejected:");
  var Side = data.Side == 1 ? 'Buy' : 'Sell';
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Type: " + Side);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Symbol: " + data.Symbol);
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Order Value: " + parseFloat(data.Price / 1e16).toFixed(6));
  logConsole("***************************************************");
  	//Enable New Orders
  	if (Side == "Buy") {
     variables.TradeLimits.BUY.OrderID = 0;
     variables.TradeLimits.BUY.ClOrdID = 0;
   } else {
     variables.TradeLimits.SELL.OrderID = 0;
     variables.TradeLimits.SELL.ClOrdID = 0;
   }
}

function onOrderBookNewOrder(data) {
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + '] OB:NEW_ORDER:'+data.side+":"+data.index);
  if (data.side == 'buy') {
    variables.orderbooktemp.bids.splice(data.index-1,0,[data.price,data.size,data.userId]);
  } else {
    variables.orderbooktemp.asks.splice(data.index-1,0,[data.price,data.size,data.userId]);
  }
  VerifyChanges();
}
function onOrderBookUpdateOrder(data) {
<<<<<<< HEAD
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + '] OB:UPDATE_ORDER:'+ data.side+":"+data.index);
=======
  console.log("onOrderBookUpdateOrder",data)
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + '] OB:UPDATE_ORDER: '+ data);
>>>>>>> 7a282233b12f4d78342b990bd0ab19d3612b93a5
}
function onOrderBookDeleteOrder(data) {
  //console.log("onOrderBookDeleteOrder",data)
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + '] OB:DELETE_ORDER:'+data.side+":"+data.index);
  if (data.side == 'buy') {
    delete variables.orderbooktemp.bids[data.index-1]; 
    var todelete = [];
    for (i = 0 ; i < variables.orderbooktemp.bids.length ;i++)
    {
     if (typeof variables.orderbooktemp.bids[i] == 'undefined') todelete.push(i);
    }
    todelete.sort(function(a, b) { return b-a });
    for (i = 0;i < todelete.length; i ++)
    {
    variables.orderbooktemp.bids.splice(todelete[i],1);
    } 
  } else {
    delete variables.orderbooktemp.asks[data.index-1];
    var todelete = [];
    for (i = 0 ; i < variables.orderbooktemp.asks.length ;i++)
    {
      if (typeof variables.orderbooktemp.asks[i] == 'undefined') todelete.push(i);
    }
    todelete.sort(function(a, b) { return b-a });
    for (i = 0;i < todelete.length; i ++)
    {
      variables.orderbooktemp.asks.splice(todelete[i],1);
    }
  }
  VerifyChanges();
}
function onOrderBookDeleteThruOrder(data) {
<<<<<<< HEAD
  //savelog(JSON.stringify(data))
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + '] OB:DELETE_ORDERS_THRU');
  if (data.side == 'buy') {
    for (i = 0 ; i < data.index ;i++)
    {
      delete variables.orderbooktemp.bids[i]; 
    }  
=======
  console.log("onOrderBookDeleteThruOrder",data)
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + '] OB:DELETE_ORDERS_THRU');
  if (data.side == 'buy') {
    delete variables.orderbooktemp.bids[data.index-1]; 
>>>>>>> 7a282233b12f4d78342b990bd0ab19d3612b93a5
    var todelete = [];
    for (i = 0 ; i < variables.orderbooktemp.bids.length ;i++)
    {
     if (typeof variables.orderbooktemp.bids[i] == 'undefined') todelete.push(i);
    }
    todelete.sort(function(a, b) { return b-a });
    for (i = 0;i < todelete.length; i ++)
    {
     variables.orderbooktemp.bids.splice(todelete[i],1);
    } 
  } else {
<<<<<<< HEAD
    for (i = 0 ; i < data.index ;i++)
    {
      delete variables.orderbooktemp.asks[i]; 
    }
=======
    delete variables.orderbooktemp.asks[data.index-1];
>>>>>>> 7a282233b12f4d78342b990bd0ab19d3612b93a5
    var todelete = [];
    for (i = 0 ; i < variables.orderbooktemp.asks.length ;i++)
    {
      if (typeof variables.orderbooktemp.asks[i] == 'undefined') todelete.push(i);
    }
    todelete.sort(function(a, b) { return b-a });
    for (i = 0;i < todelete.length; i ++)
    {
      variables.orderbooktemp.asks.splice(todelete[i],1);
    }
  }
  //Enable New Orders
  if (data.side == "Buy") {
    variables.TradeLimits.BUY.OrderID = 0;
    variables.TradeLimits.BUY.ClOrdID = 0;
  } else {
    variables.TradeLimits.SELL.OrderID = 0;
    variables.TradeLimits.SELL.ClOrdID = 0;
  }
  VerifyChanges();
}
function onOrderBookTradeNew(data) {
  logConsole("[" + dateFormat(new Date(), "h:MM:ss") + '] OB:TRADE_NEW');
<<<<<<< HEAD
  //console.log("onOrderBookTradeNew",data)
=======
  console.log("onOrderBookTradeNew",data)
>>>>>>> 7a282233b12f4d78342b990bd0ab19d3612b93a5
}

module.exports.VerifyChangesExports =function () { 
  VerifyChanges();
};
function VerifyChanges() {
  //console.log("SELL.OrderID:",variables.TradeLimits.SELL.OrderID)
  var currentidbids = parseFloat(variables.orderbooktemp['bids'][0][2]);
  var currentidasks = parseFloat(variables.orderbooktemp['asks'][0][2]);
  if (variables.TradeLimits.BUY.active == true) {
    console.log("BUY.active:",variables.TradeLimits.BUY.active)
    console.log("BUY.OrderID:",variables.TradeLimits.BUY.OrderID)
  	//Check if the last order made is different from the first order book Buy
    console.log("BUY.Check1:",(currentidbids != variables.ClientID && parseFloat(variables.orderbooktemp['bids'][0][0]) < parseFloat(parseFloat(variables.orderbooktemp['asks'][0][0]) - 0.01)))
    if (currentidbids != variables.ClientID && parseFloat(variables.orderbooktemp['bids'][0][0]) < parseFloat(parseFloat(variables.orderbooktemp['asks'][0][0]) - 0.01)) {
			//New value Calc
      var valuenew = parseFloat(variables.orderbooktemp['bids'][0][0]) + 0.01;
      if (variables.TradeLimits.BUY.min > valuenew ) {
        valuenew = variables.TradeLimits.BUY.min
      }
      if (variables.TradeLimits.BUY.max < valuenew ) {
        valuenew = variables.TradeLimits.BUY.max
      }  
      if (variables.TradeLimits.BUY.OrderID == 0) {
        var amount = variables.TradeLimits.BUY.amount;
        if (valuenew == variables.Oldorder.bids || typeof valuenew == 'undefined') {return}
        variables.Oldorder.bids = valuenew;
        console.log("price:",valuenew)
        console.log("amount:",amount)
        //Call function to buy the order in exchange
        blinktrade.sendOrder({
				  "side": "1", //buy
          "price": parseInt((valuenew * 1e8).toFixed(0)),
          "amount": parseInt((amount * 1e8).toFixed(0)),
          "symbol": "BTCBRL",
        }).then(function(order) {
          variables.TradeLimits.BUY.OrderID = order.OrderID;
          variables.TradeLimits.BUY.ClOrdID = order.ClOrdID ;
      		//save log
          savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Purchase: Amount: " + amount + " BTC | Price: " + valuenew + " BRL");
  				//Inform the user
          logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Purchase Order: Amount: " + amount + " BTC | Price: " + valuenew + " BRL@>");
        });
        return
      } else {
        console.log("BUY.Check2:",(variables.TradeLimits.BUY.min > valuenew || variables.TradeLimits.BUY.max < valuenew));
        if (variables.TradeLimits.BUY.min > valuenew || variables.TradeLimits.BUY.max < valuenew) {return}
        logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "]\x1b[91m Change bests order book BRL \x1b[0m")
        blinktrade.cancelOrder({ orderId: variables.TradeLimits.BUY.OrderID, clientId: variables.TradeLimits.BUY.ClOrdID }).then(function(order) {
          var amount = variables.TradeLimits.BUY.amount;
          if (valuenew == variables.Oldorder.bids || typeof valuenew == 'undefined') {return}
          variables.Oldorder.bids = valuenew;
          console.log("price:",valuenew)
          console.log("amount:",amount)
          //Call function to buy the order in exchange
          blinktrade.sendOrder({
				    "side": "1", //buy
            "price": parseInt((valuenew * 1e8).toFixed(0)),
            "amount": parseInt((amount * 1e8).toFixed(0)),
            "symbol": "BTCBRL",
          }).then(function(order) {
            variables.TradeLimits.BUY.OrderID = order.OrderID;
            variables.TradeLimits.BUY.ClOrdID = order.ClOrdID ;
      		  //save log
            savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Purchase: Amount: " + amount + " BTC | Price: " + valuenew + " BRL");
  				  //Inform the user
            logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Purchase Order: Amount: " + amount + " BTC | Price: " + valuenew + " BRL@>");
          });
        });
      }
    }  
    console.log("BUY.Check3:",(parseFloat(variables.orderbooktemp['bids'][0][0]) - 0.01).toFixed(2) > parseFloat(variables.orderbooktemp['bids'][1][0]))
    if ((parseFloat(variables.orderbooktemp['bids'][0][0]) - 0.01).toFixed(2) > parseFloat(variables.orderbooktemp['bids'][1][0])) {
      console.log("BUY.Check3.1:",(variables.TradeLimits.BUY.min > valuenew || variables.TradeLimits.BUY.max < valuenew))
      if (variables.TradeLimits.BUY.min > valuenew || variables.TradeLimits.BUY.max < valuenew) {return}
      logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "]\x1b[91m Change bests order book BRL \x1b[0m")
      blinktrade.cancelOrder({ orderId: variables.TradeLimits.BUY.OrderID, clientId: variables.TradeLimits.BUY.ClOrdID }).then(function(order) {
        var amount = variables.TradeLimits.BUY.amount;
        if (valuenew == variables.Oldorder.bids || typeof valuenew == 'undefined') {return}
        variables.Oldorder.bids = valuenew;
        //Call function to buy the order in exchange
        blinktrade.sendOrder({
				  "side": "1", //buy
          "price": parseInt((valuenew * 1e8).toFixed(0)),
          "amount": parseInt((amount * 1e8).toFixed(0)),
          "symbol": "BTCBRL",
        }).then(function(order) {
          variables.TradeLimits.BUY.OrderID = order.OrderID;
          variables.TradeLimits.BUY.ClOrdID = order.ClOrdID ;
      		//save log
          savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Purchase: Amount: " + amount + " BTC | Price: " + valuenew + " BRL");
  				//Inform the user
          logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Purchase Order: Amount: " + amount + " BTC | Price: " + valuenew + " BRL@>");
        });
      });
    }
  } else {
    console.log("BUY.Check4:",variables.TradeLimits.BUY.OrderID != 0)
  if (variables.TradeLimits.BUY.OrderID != 0) {
    console.log("cancelOrder BUY")
    blinktrade.cancelOrder({ orderId: variables.TradeLimits.BUY.OrderID, clientId: variables.TradeLimits.BUY.ClOrdID })
  }
}

  if (variables.TradeLimits.SELL.active == true) {
    //New value Calc
    var valuenew = parseFloat(variables.orderbooktemp['asks'][0][0]) - 0.01;
    if (variables.TradeLimits.SELL.min > valuenew ) {
      valuenew = variables.TradeLimits.SELL.min
    }
    if (variables.TradeLimits.SELL.max < valuenew ) {
      valuenew = variables.TradeLimits.SELL.max
    }  
    //Check if the last order made is different from the first order book sell
    if (currentidasks != variables.ClientID && parseFloat(variables.orderbooktemp['asks'][0][0]) > parseFloat(parseFloat(variables.orderbooktemp['bids'][0][0]) + 0.01)) {
      if (variables.TradeLimits.SELL.OrderID == 0) {
        var amount = variables.TradeLimits.SELL.amount;
        if (valuenew == variables.Oldorder.asks || typeof valuenew == 'undefined') {return}
        variables.Oldorder.asks = valuenew;
        //Call function to buy the order in exchange
        blinktrade.sendOrder({
				  "side": "2", //sell
          "price": parseInt((valuenew * 1e8).toFixed(0)),
          "amount": parseInt((amount * 1e8).toFixed(0)),
          "symbol": "BTCBRL",
        }).then(function(order) {
          variables.TradeLimits.SELL.OrderID = order.OrderID;
          variables.TradeLimits.SELL.ClOrdID = order.ClOrdID ;
          //save log
          savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Sale: Amount: " + amount + " BTC | Price: " + valuenew + " BRL");
  		    //Inform the user
          logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Sale Order: Amount: " + amount + " BTC | Price: " + valuenew + " BRL@>");
        });
      return
    } else {
      if (variables.TradeLimits.SELL.min > valuenew || variables.TradeLimits.SELL.max < valuenew) {return}
      logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "]\x1b[91m Change bests order book BRL \x1b[0m")
      blinktrade.cancelOrder({ orderId: variables.TradeLimits.SELL.OrderID, clientId: variables.TradeLimits.SELL.ClOrdID }).then(function(order) {
        var amount = variables.TradeLimits.SELL.amount;
        if (valuenew == variables.Oldorder.asks || typeof valuenew == 'undefined') {return}
        variables.Oldorder.asks = valuenew;
        //Call function to SELL the order in exchange
        blinktrade.sendOrder({
				  "side": "2", //sell
          "price": parseInt((valuenew * 1e8).toFixed(0)),
          "amount": parseInt((amount * 1e8).toFixed(0)),
          "symbol": "BTCBRL",
        }).then(function(order) {
          variables.TradeLimits.SELL.OrderID = order.OrderID;
          variables.TradeLimits.SELL.ClOrdID = order.ClOrdID ;
      	 //save log
          savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Sale: Amount: " + amount + " BTC | Price: " + valuenew + " BRL");
  			 //Inform the user
          logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Sale Order: Amount: " + amount + " BTC | Price: " + valuenew + " BRL@>");
        });
      });
    }
  }
  if ((parseFloat(variables.orderbooktemp['asks'][0][0]) + 0.01).toFixed(2) < parseFloat(variables.orderbooktemp['asks'][1][0])) {
    if (variables.TradeLimits.SELL.min > valuenew || variables.TradeLimits.SELL.max < valuenew) {return}
    logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "]\x1b[91m Change bests order book BRL \x1b[0m")
    blinktrade.cancelOrder({ orderId: variables.TradeLimits.SELL.OrderID, clientId: variables.TradeLimits.SELL.ClOrdID }).then(function(order) {
      var amount = variables.TradeLimits.SELL.amount;
      if (valuenew == variables.Oldorder.asks || typeof valuenew == 'undefined') {return}
      variables.Oldorder.asks = valuenew;
      //Call function to sell the order in exchange
      blinktrade.sendOrder({
				"side": "2", //sell
        "price": parseInt((valuenew * 1e8).toFixed(0)),
        "amount": parseInt((amount * 1e8).toFixed(0)),
        "symbol": "BTCBRL",
      }).then(function(order) {
        variables.TradeLimits.SELL.OrderID = order.OrderID;
        variables.TradeLimits.SELL.ClOrdID = order.ClOrdID ;
      	//save log
        savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] Foxbit Creating Sale: Amount: " + amount + " BTC | Price: " + valuenew + " BRL");
  			//Inform the user
        logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@Foxbit Creating Sale Order: Amount: " + amount + " BTC | Price: " + valuenew + " BRL@>");
      });
    });
  }
  } else {
    if (variables.TradeLimits.SELL.OrderID != 0) {
      console.log("CancelOrder SELL")
      blinktrade.cancelOrder({ orderId: variables.TradeLimits.SELL.OrderID, clientId: variables.TradeLimits.SELL.ClOrdID })
    }
  }
} 


//get Ledger
function requestLedger() {
  try {
    blinktrade.requestLedger().then(function(ledger) {
      if (typeof ledger['LedgerListGrp'][0] == 'undefined') {
        return undefined;
      } else {
        variables.ledgertemp = ledger;
      }
      if (variables.LedgerIDs.FOX == 0) {
        variables.LedgerIDs.FOX = ledger['LedgerListGrp'][0].LedgerID;
      } else if (variables.LedgerIDs.FOX != ledger['LedgerListGrp'][0].LedgerID) {
        for(var i = 0; i < ledger['LedgerListGrp'].length; i++) {
          if (variables.LedgerIDs.FOX == ledger['LedgerListGrp'][i].LedgerID) {
            variables.LedgerIDs.FOX = ledger['LedgerListGrp'][0].LedgerID;
            return
          }
          var Operationx = ledger['LedgerListGrp'][i].Operation = "C" ? 'Credit' : 'Debit';
          logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] <@FOX Trade Ledger | LedgerID: " + ledger['LedgerListGrp'][i].LedgerID + " | Operation: " + Operationx + " | Amount: " + parseFloat(ledger['LedgerListGrp'][i].Amount / 1e8).toFixed(6) + " " + ledger['LedgerListGrp'][i].Currency + " | Description: " +  switchLedger(ledger['LedgerListGrp'][i].Description) + "@>");
          savelog("[" + dateFormat(new Date(), "h:MM:ss") + "] FOX Trade Ledger | LedgerID: " + ledger['LedgerListGrp'][i].LedgerID + " | Operation: " + Operationx + " | Amount: " + parseFloat(ledger['LedgerListGrp'][i].Amount / 1e8) + " " + ledger['LedgerListGrp'][i].Currency + " | Description: " +  switchLedger(ledger['LedgerListGrp'][i].Description));
        }
        variables.LedgerIDs.FOX = ledger['LedgerListGrp'][0].LedgerID;
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
      variables.orderstemp = myOrders['OrdListGrp']
    });
  } catch (err) {
    console.log("Orderbook GET", err)
  }
}


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

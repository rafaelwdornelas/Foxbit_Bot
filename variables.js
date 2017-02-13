
exports.ClientID =0;
exports.orderbooktemp = [];
exports.LedgerIDs = {FOX: 0};
exports.ledgertemp = [];
exports.orderstemp = [];
exports.Oldorder = {bids: 0,asks: 0};
exports.TradeLimits = {
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
					},
						PROFIT: {
							active: false, 
              				amount: 0.0
						}
					 };
exports.infoBalanceBRL = {BRL: 0,BTC: 0,BRL_locked: 0,BTC_locked: 0};

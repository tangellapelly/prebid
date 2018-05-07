var utils = require('../utils.js');
var bidfactory = require('../bidfactory.js');
var bidmanager = require('../bidmanager.js');
var adloader = require('../adloader');
var STATUS = require('../constants').STATUS;
//Adapter version: 0.81

var KomoonaAdapter = function KomoonaAdapter() {
  var KOMOONA_BIDDER_NAME = 'komoona';
  var pbjsObject = window.$$PREBID_GLOBAL$$;

  function _callBids(params) {
    var kbConf = {
      ts_as: new Date().getTime(),
      hb_placements: [],
      hb_placement_bidids: {},
      kb_callback: _bid_arrived,
      hb_floors: {}
    };

    var bids = params.bids || [];
    if (!bids || !bids.length) {
      return;
    }

    bids.forEach((currentBid) => {
      kbConf.hdbdid = kbConf.hdbdid || currentBid.params.hbid;
      kbConf.encode_bid = kbConf.encode_bid || currentBid.params.encode_bid;
      kbConf.hb_placement_bidids[currentBid.params.placementId] = currentBid.bidId;
      if (currentBid.params.floorPrice) {
        kbConf.hb_floors[currentBid.params.placementId] = currentBid.params.floorPrice;
      }
      kbConf.hb_placements.push(currentBid.params.placementId);      
    });

    var scriptUrl = `//s.komoona.com/kb/0.1/kmn_sa_kb_c.${kbConf.hdbdid}.js`;

    adloader.loadScript(scriptUrl, function() {
      /*global KmnKB */
      if (typeof KmnKB === 'function') {
        KmnKB.start(kbConf, pbjsObject);
      }
    }, true);
  }

  function _bid_arrived(bid) {
    var bidObj = utils.getBidRequest(bid.bidid);
    var bidStatus = bid.creative ? STATUS.GOOD : STATUS.NO_BID;
    var bidResponse = bidfactory.createBid(bidStatus, bidObj);
    bidResponse.bidderCode = KOMOONA_BIDDER_NAME;

    if (bidStatus === STATUS.GOOD) {
      bidResponse.ad = bid.creative;
      bidResponse.cpm = bid.cpm;
      bidResponse.width = parseInt(bid.width);
      bidResponse.height = parseInt(bid.height);
    }

    var placementCode = bidObj && bidObj.placementCode;
    bidmanager.addBidResponse(placementCode, bidResponse);
  }

  // Export the callBids function, so that prebid.js can execute this function
  // when the page asks to send out bid requests.
  return {
    callBids: _callBids,
  };
};

module.exports = KomoonaAdapter;
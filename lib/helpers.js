/*
 * Helpers for various tasks
 *
 */

// Dependencies
var crypto = require('crypto');
var querystring = require('querystring');
var config = require('./config');
var https = require('https');

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a random string with given length
helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    var possibleCharacters = 'abcdefghjklmnopqrstuvwxyz1234567890';
    //Start the final string
    var str = '';
    for (i=1; i <= strLength; i++) {
      // Get a random possible characters
      var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
      //Append this character to the final string
      str += randomCharacter;
    }
    // Return the final string
    return str;

  } else {
    return false;
  }
}

helpers.payOrder = function(amount, card, orderId, callback) {
  // verfity required details
  var orderId = typeof(orderId) == 'string' && orderId.length == 20 ? orderId : false;
  var amount = typeof(amount) == 'number'? amount: false;
  var card = typeof(card) == 'string' && ['tok_visa','tok_mastercard'].indexOf(card) > -1 ? card : false;

  if (orderId && amount && card) {

    var payload = {
      'amount': amount,
      'currency':'usd',
      'source': 'tok_visa'
    }

    // Stringify the payload
    var stringPayload = querystring.stringify(payload);

    var requestDetails = {
      // Use specified auth token or use default from this stripe instance:
      'protocol' : 'https:',
      'hostname': 'api.stripe.com',
      'path': '/v1/charges',
      'method': 'POST',
      'headers': {
        'Authorization': 'Bearer ' + config.config.stripeKey,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload)
      }
    }

    var req = https.request(requestDetails, function(res) {
      var status = res.statusCode;
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback('Status code was returned: ' + status);
      }
    });

    req.on('error', function(e) {
      console.log('req err: ' + e);
    })

    req.write(stringPayload);
    req.end();
  } else {
    callback('Missing required information.')
  }

}

// Export the module
module.exports = helpers;

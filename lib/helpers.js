/*
 * Helpers for various tasks
 *
 */

// Dependencies
var crypto = require('crypto');
var querystring = require('querystring');
var config = require('./config');
var http = require('https');

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

helpers.stripeTest = function() {

  var payload = {
    'amount':300,
    'currency':'usd' ,
    'source':'visa',
    'receipt_email':'mike2311@gmail.com'
  }

  // Stringify the payload
  var stringPayload = querystring.stringify(payload);

  var requestDetails = {
    // Use specified auth token or use default from this stripe instance:
    'protocol' : 'https:',
    'hostName': 'api.stripe.com',
    'path': 'v1/charges',
    'port': 3000,
    'method': 'POST',
    'headers': {
      'Authorization': 'Bearer ' + config.config.stripeKey,
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length' : Buffer.byteLength(stringPayload)
    }
  }

  var req = http.request(requestDetails, function(res) {
    var status = res.statusCode;
    if (status == 200 || status == 201) {
      callback('It is working');
    } else {
      callback('Status code was returned') + statusCode;
    }
  });

  req.on('error', function(e) {
    console.log('req err: ' + e);
  })

  req.write(stringPayload);
  req.end();

}

// Export the module
module.exports = helpers;

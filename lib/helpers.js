/*
 * Helpers for various tasks
 *
 */

// Dependencies
var crypto = require('crypto');
var querystring = require('querystring');
var config = require('./config');
var https = require('https');
var path = require('path');
var fs = require('fs');

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
      'source': card
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
        console.log('looks okay')
        callback(false);
      } else {
        console.log('not okay')
        callback('Status code was returned: ' + status);
      }
    });

    req.on('error', function(e) {
      console.log('has problem');
      console.log('req err: ' + e);
    })

    req.write(stringPayload);
    req.end();
  } else {
    callback('Missing required information.')
  }
}

helpers.sendEmail = function(name, email, callback) {
  // Verify required information
  var name = typeof(name) == 'string' && name.trim().length > 0 ? name.trim() : false;
  var email = typeof(email) == 'string' && email.trim().length > 0 && email.includes('@') && email.includes('.') ? email.trim() : false;

  var message = "The payment of your order has gone through! Your pizza is now on the way!"

  var payload = {
    'from': 'Pizza Delivery <postmaster@' + config.config.mailgunKey.domain + '>',
    'to': name + ' <' + email + '>',
    'subject': 'Order successful',
    'text': message
  }

  // Stringify the payload
  var stringPayload = querystring.stringify(payload);

  var requestDetails = {
    // Use specified auth token or use default from this stripe instance:
    'protocol' : 'https:',
    'hostname': 'api.mailgun.net',
    'path': '/v3/' + config.config.mailgunKey.domain + '/messages',
    'method': 'POST',
    'auth': config.config.mailgunKey.token,
    'headers': {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length' : Buffer.byteLength(stringPayload)
    }
  }

  var req = https.request(requestDetails, function(res) {
    var status = res.statusCode;
    if (status == 200 || 201) {
      console.log('email sent');
      callback(false)
    } else {
      callback('status code was returned' + status);
    }
  });

  req.on('error', function(e) {
    console.log('Error: ' + e);
  })

  req.write(stringPayload);
  req.end();
}

// Get the string content of a template
helpers.getTemplate = function(templateName, data, callback) {
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof(data) == 'object' && data!= null ? data : {};
  if (templateName) {
    var templateDir = path.join(__dirname, '/../templates/');
    fs.readFile(templateDir + templateName + '.html', 'utf8', function (err, str) {
      if (!err && str && str.length > 0) {
        // Do interpolation on the string
        var finalString = helpers.interpolate(str, data);
        callback(false, finalString);
      } else {
        callback('No template could be found');
      }
    })
  } else {
    callback('A valid template name was not specified');
  }
};

// Add the universal header and footer to a string and pass the provided data object to the header and footer for interpolation
helpers.addUniversalTemplates = function(str, data, callback) {
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data!= null ? data : {};
  // Get the Header
  helpers.getTemplate('_header', data, function(err, headerString){
    if(!err && headerString) {
      helpers.getTemplate('_footer', data, function (err, footerString) {
        if (!err && footerString) {
          // Add them together
          var fullString = headerString + str + footerString;
          callback(false, fullString);
        } else {
          callback ('Could not find footer string')
        }
      });
    } else {
      callback('Could not find the header string')
    }
  });
}

// Take a given string and a data object and fine/replace all the key within it
helpers.interpolate = function (str, data) {
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data!= null ? data : {};

  // Add the templateGlobal to the data object. Prepending their key name with global
  for (var keyName in config.config.templateGlobals) {
    if (config.config.templateGlobals.hasOwnProperty(keyName)) {
      data['global.' + keyName] = config.config.templateGlobals[keyName];
    }
  }

  // For each key n the data object, insert its value into the string at the corresponding placeholder
  for (var key in data) {
    if (data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
      var replace = data[key];
      var find = '{'+key+'}';
      str = str.replace(find, replace);
    }
  }
  return str;

};

// Get the content of a static (public) asset
helpers.getStaticAsset = function(fileName, callback) {
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if (fileName) {
    var publicDir = path.join(__dirname, '/../public/');
    fs.readFile(publicDir + fileName, function(err,data) {
      if (!err && data) {
        callback(false, data)
      } else {
        callback('No file could be found');
      }
    })
  } else {
    callback ('A valid file name was not spiecifed')
  }
};

// Export the module
module.exports = helpers;

/*
 *  master file
 */

 // dependencies
 var http = require('http');
 var url = require('url');
 var StringDecoder = require('string_decoder').StringDecoder;
 var path = require('path');
 var util = require ('util');
 var debug = util.debuglog('server');
 var handlers = require('./lib/handlers');
 var helpers = require('./lib/helpers');
 var fs = require('fs');

 // Declare the app
 var app = {};

 // initiate the app
 app.init = function() {
   app.httpServer.listen(3000, function() {
     console.log('\x1b[36m%s\x1b[0m', 'The HTTP server is running on port 3000');
   })
 }

// instantiate the HTTP server
app.httpServer = http.createServer(function(req,res) {
  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //Get the headers as an object
  var headers = req.headers;

  // Get the payload,if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
      buffer += decoder.write(data);
  });
  req.on('end', function() {
      buffer += decoder.end();

      // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
      debug(app.router)
      var chosenHandler = typeof(app.router[trimmedPath]) !== 'undefined' ? app.router[trimmedPath] : handlers.notFound;
      // Construct the data object to send to the handler
      var data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : helpers.parseJsonToObject(buffer)
      };

      // Route the request to the handler specified in the router
      chosenHandler(data,function(statusCode,payload){

        // Use the status code returned from the handler, or set the default status code to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

        // Use the payload returned from the handler, or set the default payload to an empty object
        payload = typeof(payload) == 'object'? payload : {};

        // Convert the payload to a string
        var payloadString = JSON.stringify(payload);

        // Return the response
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(statusCode);
        res.end(payloadString);
        console.log(statusCode);

        // if the response is 200, print green otherwise print red
        if (statusCode == 200) {
          debug('\x1b[32m%s\x1b[0m',method.toUpperCase() + ' /' + trimmedPath + statusCode);
          console.log(method.toUpperCase() + ' /' + trimmedPath + statusCode)
        } else {
          debug('\x1b[31m%s\x1b[0m',method.toUpperCase() + ' /' + trimmedPath + statusCode);
        }
      });
  });
});

// Define the request router
app.router = {
  'users' : handlers.users,
  'signup' : handlers.signUp,
  'login': handlers.logIn,
  'menu' : handlers.menu.get,
  'order' : handlers.orders,
  'test': handlers.test
};

// Execute init function
app.init();

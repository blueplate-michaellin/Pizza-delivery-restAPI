var helpers = require('./helpers');
var _data = require('./data');
var config = require('./config');

// Declar handlers
var handlers = {}

// Not-Found
handlers.notFound = function(data,callback){
  callback(404, {'Error':'Route not found'});
};

handlers.users = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for all the users methods
handlers._users = {};

// Users - post
// Required data: name, email, password, home address
handlers._users.post = function(data, callback) {
  // Check that all required fields are filled out
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.length > 0 ? data.payload.address : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (name && email && address && password) {
    // Make sure user doesn't exist
    _data.read('user', email, function(err,data) {
      if(err) {
        // Hash the password
        var hashPassword = helpers.hash(password);

        // Create user object
        if (hashPassword) {
          var userObject = {
            'name' : name,
            'email': email,
            'address': address,
            'password': hashPassword
          }

          // Store user
          _data.create('users', email, userObject, function(err) {
            if (!err) {
              callback(200)
            } else {
              callback(500, {'Error': 'Could not create new user'})
            }
          });
        } else {
          callback(500, {'Error': 'Could not hash password'})
        }
      } else {
        callback(400, {'Error': 'User already exist'})
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
}

// Users - get
handlers._users.get = function(data, callback) {
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
  if (email) {
    // Get token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify the given token from header is valid from the email address
    handlers._tokens.verifyToken(token, email, function(tokenisValid) {
      if (tokenisValid) {
        // Remove password from the user object
        _data.read('users', email, function(err,data) {
          if (!err && data) {
            delete data.hashPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {'Error': 'Token is either missing or invalid'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
}

// Users - put
handlers._users.put = function(data, callback) {
  // Check that all required fields are filled out
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.length > 0 ? data.payload.address : false;
}

// Users - delete
handlers._users.delete = function(data, callback) {

}

// Export the module
module.exports = handlers;

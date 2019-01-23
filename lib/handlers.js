var helpers = require('./helpers');
var _data = require('./data');
var config = require('./config');

// Declar handlers
var handlers = {}

// Not-Found
handlers.notFound = function(data,callback){
  callback(404, {'Error':'Route not found'});
};

handlers.signUp = function(data,callback) {
  if (data.method == 'post') {
    handlers.users(data, callback);
  } else {
    callback(405);
  }
};

handlers.logIn = function(data, callback) {
  if (data.method == 'post') {
    handlers.token(data, callback);
  } else {
    callback(405);
  }
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
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && data.queryStringObject.email.includes('@') && data.queryStringObject.email.includes('.') ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get token from the headers
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  // Verify the given token from header is valid from the email address
  handlers._token.verifyToken(token, email, function(tokenisValid) {
    if (tokenisValid) {
        _data.read('users', email, function(err,data) {
          if (!err && data) {
            // Remove password from the user object
            delete data.password;
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
  // Check for rquired field
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
  // Check for optional field
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.length > 0 ? data.payload.address : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email) {
    if (name || address || password) {
      // Get token from the headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._token.verifyToken(token, email, function(tokenisValid){
        //Look up the user
        _data.read('users', email, function(err, userData){
          if (!err && userData) {
            if (name) {
              userData.name = name;
            }
            if (address) {
              userData.address = address;
            }
            if (password) {
              userData.password = helpers.hash(password);
            }
            // Update user file using userData
            _data.update('users', email, userData, function(err) {
              if (!err) {
                callback (200);
              } else {
                callback(500, {'Error': 'Error when updating the user data'});
              }
            })
          } else {
            callback(400, {'Error': 'User does not exist'})
          }
        })
      })
    } else {
      callback (400, {'Error': 'Missing fields to update'});
    }
  } else {
    callback (400, {'Error': 'Missing email address'});
  }
};

// Users - delete
handlers._users.delete = function(data, callback) {

}

// Initiate token handler
handlers.token = function(data, callback) {
  var allowedMethod = ['post','get','put','delete'];
  if (allowedMethod.indexOf(data.method) > -1) {
    handlers._token[data.method](data, callback);
  } else {
    callback(405)
  }
}

// Container for private methods for token handlers
handlers._token = {}

// Token - post
// Required: email, password
handlers._token.post = function(data, callback) {
  // Verify required fields
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && data.payload.email.includes('@') && data.payload.email.includes('.') ? data.payload.email.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password) {
    _data.read('users', email, function(err, userData) {
      if (!err && userData) {
        // Check if token field exist
        var userToken = typeof(userData.token) == 'object' && userData.token instanceof Array ? userData.token : [];
        // Hash login password
        var hashedPassword = helpers.hash(password);
        // Check if password submitted matches with record
        if (hashedPassword == userData.password) {
          // check if token already created before for this specific user
          if(!userData.token){
            var token = helpers.createRandomString(20);
            var tokenObject = {
              'email': email,
              'token': token
            };
            // Store the token in tokens folder
            _data.create('tokens', token, tokenObject, function(err) {
              if (!err) {
                // create token for session
                userData.token = userToken;
                userData.token.push(token);
                // Save the new user data
                _data.update('users', email, userData, function(err) {
                  if (!err) {
                    callback(200, tokenObject);
                  } else {
                    callback(500, {'Error': 'Could not update user with the token created'})
                  }
                });
              } else {
                callback(500,{'Error': 'Unable to create token'})
              }
            });
          } else {
            callback(400, {'Error': 'Token is already existed. You might have already logged in'});
          }
        } else {
          callback(400, {'Error': 'Incorrect password'});
        }
      } else {
        callback(400, {'Error': 'User not found'});
      }
    })
  } else {
    callback(400, {'Error': 'Missing required fields'})
  }
}

// Token - get
// Required field: token
handlers._token.get = function(data, callback) {
  // Verify required field
  var token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.length == 20 ? data.queryStringObject.token : false;

  if (token) {
    // Look up token
    _data.read('tokens', token, function(err, tokenData) {
      if(!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback (404);
      }
    })
  } else {
    callback(400, {'Error': 'missing email address'})
  }
}

// Token - delete
// Required field: id
handlers._token.delete = function(data, callback) {
  // Verify required field
  var token = typeof(data.queryStringObject.token) == 'string' && data.queryStringObject.token.length == 20 ? data.queryStringObject.token : false;
  if (token) {
    // Look up token
    _data.read('tokens', token, function(err, tokenData) {
      if (!err && tokenData) {
        _data.delete('tokens', token, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Error deleting token'});
          }
        });
      } else {
        callback(400, {'Error': 'Error finding token required'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// Token - verifyToken
// Required field: token
handlers._token.verifyToken = function(token, email, callback) {
  if (token) {
    console.log(token);
    _data.read('tokens', token, function(err, tokenData) {
      if (!err && tokenData) {
        // Check the token is for the given user
        console.log(tokenData.email);
        if (tokenData.email == email) {
          callback(true);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    });
  } else {
    callback(false);
  }
}

// Create menu container
handlers.menu = {};

// Menu - Get
handlers.menu.get = function(data, callback) {
  if (data.method == 'get') {
    if(data.headers.token) {
      _data.read('menu', 'menu', function(err, menuData) {
        if(!err && menuData) {
          callback(200, menuData);
        } else {
          callback(500, {'Error': 'Error getting menu information'})
        }
      });
    } else {
      callback(400, {'Error': 'Please log in to access to the menu'});
    }
  } else {
    callback(405)
  }
}

handlers.orders = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._orders[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Create orders container
handlers._orders = {};

// Orders - Post
handlers._orders.post = function(data, callback) {
  // Verify required fields
  var dishOrders = typeof(data.payload.orders) =='object' ? data.payload.orders:false;
  if (dishOrders) {
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    _data.read('tokens',token, function(err, tokenData) {
      if (!err && tokenData) {
        // Check if the users has an existing order
        var userEmail = tokenData.email;
        _data.read('users', userEmail, function(err, userData) {
          if (!err && userData) {
            // Check to make sure there is no existing order
            var userOrder = typeof(userData.order) == 'string' ? userData.order : false;
            if (!userOrder) {
              // Create order id
              var orderId = helpers.createRandomString(20);

              // Define variables with preset values
              var totalPrice = 0;
              var verifiedDishes = 0;

              // Check if the dishes in the order exist in the menu
              var menu = _data.read('menu', 'menu', function(err, data) {
                if (!err && data) {
                  for (i=0; i < data.menu.length; i++) {
                    for (j=0; j < dishOrders.length; j++) {
                      if(data.menu[i].dishName.indexOf(dishOrders[j].dishName) > -1){
                        totalPrice += data.menu[i].price;
                        verifiedDishes++
                      } else {
                        continue;
                      }
                    }
                  }
                  if (verifiedDishes == dishOrders.length) {
                    // if all the dishes in the orders exist in the menu, save all details to order object
                    var orderObject = {
                      'orderId': orderId,
                      'email': userEmail,
                      'orders': dishOrders,
                      'totalPrice': totalPrice,
                      'paymentStatus': "Not submitted",
                      'createdAt': Date.now(),
                      'updatedAt': Date.now()
                    }

                    // Store order
                    _data.create('orders', orderId, orderObject, function(err) {
                      if (!err) {
                        // Update users
                        // Add the checkid to user object
                        userData.order = orderId;

                        //Save the new user data
                        _data.update('users', userEmail, userData, function(err) {
                          if(!err) {
                            // Return the data the new check
                            callback(200, orderObject);
                          } else {
                            callback(500, {'Error': 'Could not update the user with the new order'});
                          }
                        });
                      } else {
                        callback(500, {'Error': 'Could not save order details'});
                      }
                    });
                  } else {
                    // Server returns error if there is an invalid dish in the order, and value in variables reset
                    callback(400,{'Error': 'Some dishes are not available in the menu. Please check again'})
                  }
                } else {
                  callback(500, {'Error': 'Could not get menu data'})
                }
              });
            } else {
              callback(400, {'Error': 'There is an existing order, please either check out or delete the existing order, and try again.'})
            }
          } else {
            callback(500, {'Error': 'Could not get user data'})
          }
        });
      } else {
        callback(400, {'Error': 'Missing token'})
      }
    });
  }
}

// Orders - Get
// Required information: token, orderId
handlers._orders.get = function(data, callback) {
  // Verify required information
  var orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.length == 20 ? data.queryStringObject.orderId : false;
  if (orderId) {
    // Verify token
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    if (token) {
      _data.read('orders', orderId, function(err, data) {
        if (!err) {
          callback(200, data);
        } else {
          callback(400, {'Error': 'Unable to retrieve order details, please make sure you have the correct order ID'})
        }
      })
    } else {
      callback(400, {'Error': 'Missing token'});
    }
  } else {
    callback(400, {'Error': 'Missing order id'});
  }
}

// Orders - Put
// Required info: token, orderId, orders
handlers._orders.put = function(data, callback) {
  // Verify required information
  var orderId = typeof(data.payload.orderId)  == 'string' && data.payload.orderId.length == 20 ? data.payload.orderId : false;
  var orders = typeof(data.payload.orders) == 'object' ? data.payload.orders : false;

  if (orderId && orders) {

    // Verify token
    var token = typeof(data.headers.token) == 'string' && data.headers.token.length == 20 ? data.headers.token : false;

    if (token) {

      // Read data
      _data.read('orders', orderId, function(err, orderData) {

        // Define variables with preset values
        var totalPrice = 0;
        var verifiedDishes = 0;

        if (!err, orderData) {

          // Check if the dishes in the order exist in the menu
          var menu = _data.read('menu', 'menu', function(err, menuData) {
            if (!err && menuData) {
              for (i=0; i < menuData.menu.length; i++) {
                for (j=0; j < orders.length; j++) {
                  if(menuData.menu[i].dishName.indexOf(orders[j].dishName) > -1){
                    totalPrice += menuData.menu[i].price;
                    verifiedDishes++
                  } else {
                    continue;
                  }
                }
              }
              console.log(orders.length, verifiedDishes)
              if (verifiedDishes == orders.length) {

                // update latest information to orderData
                orderData.orders = orders;
                orderData.totalPrice = totalPrice;
                orderData.updatedAt = Date.now();

                // update latest orderData to order file
                _data.update('orders', orderId, orderData, function(err) {
                  if (!err) {
                    callback(200, orderData);
                  } else {
                    callback(500,{'Error': 'Error updating order'});
                  }
                });
              } else {
                callback(400, {'Error': 'Some dishes do not appear in our menu, please check again'});
              }
            } else {
              callback (500, {'Error': 'Error when retrieving order data'})
            }
          });
        } else {
          callback(400, {'Error': 'Missing token'});
        }
      });
    } else {
      callback(400, {'Error': 'order information is missing'});
    }
  } else {
    callback(400, {'Error': 'missing required information'})
  }
}

// Orders - Delete
// required data: orderId
handlers._orders.delete = function(data, callback) {
  // Verify required information
  var orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.length == 20 ? data.queryStringObject.orderId : false;
  if (orderId) {
    // Verify token
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    if (token) {
      _data.read('tokens', token, function(err, tokenData) {
        if (!err) {
          _data.read('users', tokenData.email, function(err, userData) {
            if (!err) {
              userData.order="";
              _data.update('users', userData.email, userData, function(err) {
                if (!err) {
                  _data.delete('orders', orderId, function(err) {
                    if (!err) {
                      callback(200);
                    } else {
                      callback(500, {'Error': 'Unable to delete order'});
                    }
                  });
                } else {
                  callback(500, {'Error': 'Unable to update user details'})
                }
              });
            } else {
              callback(500, {'Error': 'Unable to retreieve users details'})
            }
          })
        } else {
          callback(500, {'Error': 'Unable to get token details'})
        }
      });
    } else {
      callback(400, {'Error': 'Missing token'});
    }
  }
}

handlers.payment = function(data,callback) {

  // Check to make sure this is a post request only
  if (data.method == "post") {

    // Verify required information
    var orderId = typeof(data.payload.orderId) == 'string' && data.payload.orderId.length == 20 ? data.payload.orderId : false;
    var card = typeof(data.payload.card) == 'string' && ['tok_visa','tok_mastercard'].indexOf(data.payload.card) > -1 ? data.payload.card : false;
    console.log(orderId, card);

    if (orderId && card) {
      // Verify token
      var token = typeof(data.headers.token) == 'string' && data.headers.token.length == 20 ? data.headers.token : false;
      if (token) {
        _data.read('tokens', token, function(err, tokenData) {
          if (!err && tokenData) {
            // get user email to retreive users account for order ID
            _data.read('users', tokenData.email, function(err, userData) {
              if (!err && userData) {
                _data.read('orders', userData.order, function(err, orderData) {
                  if (!err && orderData) {

                    // Check whether the order was paid previously
                    if (orderData.paymentStatus == "Not submitted") {
                      helpers.payOrder(orderData.totalPrice, card, orderData.orderId, function(err){
                        if(!err) {
                          orderData.paymentStatus = 'successful';
                          _data.update('orders', orderData.orderId, orderData, function(err) {
                            if (!err) {
                              userData.order = '';
                              _data.update('users', userData.email, userData, function(err) {
                                if (!err) {
                                  callback(200, {'success': 'Payment completed'});
                                  helpers.sendEmail(userData.name, userData.email, function(err) {
                                    if (err) {
                                      console.log('Failed to send email to user');
                                    }
                                  })
                                } else {
                                  callback(500, {'Error': 'Unable to update user data'})
                                }
                              })
                            } else {
                              callback(500, {'Error': 'Unable to update order data'})
                            }
                          })
                        } else {
                          orderData.paymentstatus = 'failed';
                          _data.update('orders', orderData.orderId, orderData, function(err) {
                            if (!err) {
                              callback(500, {'Error': 'Payment unsuccessful'})
                            } else {
                              callback (500, {'Error': 'Payment unsuccessful and error updating user details'})
                            }
                          })
                        }
                      });
                    } else {
                      callback(400, {'Error': 'You paid for this order previously. Please double check'})
                    }
                  } else {
                    callback(500, {'Error': 'Error reading order data'})
                  }
                })
              } else {
                callback(500, {'Error': 'Error reading user details'});
              }
            });
          } else {
            callback(500, {'Error': 'Error reading token details'});
          }
        })
      } else {
        callback(400, {'Error': 'Missing token'});
      }
    } else {
      callback(400, {'Error': 'Missing required information'});
    }
  } else {
    callback(404, {'Error': 'Unable to process request'});
  }
}

// Export the module
module.exports = handlers;

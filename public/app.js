/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  'sessionToken' : false
};

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function(headers,path,method,queryStringObject,payload,callback){

  // Set defaults
  headers = typeof(headers) == 'object' && headers !== null ? headers : {};
  path = typeof(path) == 'string' ? path : '/';
  method = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof(payload) == 'object' && payload !== null ? payload : {};
  callback = typeof(callback) == 'function' ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path+'?';
  var counter = 0;
  for(var queryKey in queryStringObject){
     if(queryStringObject.hasOwnProperty(queryKey)){
       counter++;
       // If at least one query string parameter has already been added, preprend new ones with an ampersand
       if(counter > 1){
         requestUrl+='&';
       }
       // Add the key and value
       requestUrl+=queryKey+'='+queryStringObject[queryKey];
     }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for(var headerKey in headers){
     if(headers.hasOwnProperty(headerKey)){
       xhr.setRequestHeader(headerKey, headers[headerKey]);
     }
  }

  // If there is a current session token set, add that as a header
  if(app.config.sessionToken){
    console.log(app.config.sessionToken.token);
    xhr.setRequestHeader("token", app.config.sessionToken.token);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function() {
      if(xhr.readyState == XMLHttpRequest.DONE) {
        var statusCode = xhr.status;
        var responseReturned = xhr.responseText;

        // Callback if requested
        if(callback){
          try{
            var parsedResponse = JSON.parse(responseReturned);
            callback(statusCode,parsedResponse);
          } catch(e){
            callback(statusCode,false);
          }

        }
      }
  }

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  console.log(payload)
  xhr.send(payloadString);

};

// Add to cart button
app.addToCart = function() {
  if (document.getElementById("processOrder")) {
    document.getElementById("pepperoni").addEventListener('click', function () {
      var dishName = {"dishName": "Pepperoni Pizza"};
      var payload = {};
      payload.orders = [];
      payload.orders.push(dishName);
      console.log(payload);
      app.client.request(undefined,'api/orders','POST',undefined,payload, function(statusCode,responsePayload){
        if (statusCode == 200) {
          window.location = '/pay';
        } else {
          UIkit.modal.alert(responsePayload.Error)
        }
      });
    });
    document.getElementById("Magharitta").addEventListener('click', function () {
      var dishName = {"dishName": "Magharitta Pizza"};
      var payload = {};
      payload.orders = [];
      payload.orders.push(dishName);
      console.log(payload);
      app.client.request(undefined,'api/orders','POST',undefined,payload, function(statusCode,responsePayload){
        if (statusCode == 200) {
          window.location = '/pay';
        } else {
          UIkit.modal.alert(responsePayload.Error)
        }
      });
    });
    document.getElementById("4-cheese").addEventListener('click', function () {
      var dishName = {"dishName": "4-Cheese Pizza"};
      var payload = {};
      payload.orders = [];
      payload.orders.push(dishName);
      console.log(payload);
      app.client.request(undefined,'api/orders','POST',undefined,payload, function(statusCode,responsePayload){
        if (statusCode == 200) {
          window.location = '/pay';
        } else {
          UIkit.modal.alert(responsePayload.Error)
        }
      });
    });
    document.getElementById("400-cheese").addEventListener('click', function () {
      var dishName = {"dishName": "400-Cheese Pizza"};
      var payload = {};
      payload.orders = [];
      payload.orders.push(dishName);
      console.log(payload);
      app.client.request(undefined,'api/orders','POST',undefined,payload, function(statusCode,responsePayload){
        if (statusCode == 200) {
          window.location = '/pay';
        } else {
          UIkit.modal.alert(responsePayload.Error)
        }
      });
    });
  }
};

// display shopping cart
app.shoppingCart = function() {
  if (document.getElementById("shoppingCart")) {
    // Get the current token id
    var tokenId = typeof(app.config.sessionToken.token) == 'string' ? app.config.sessionToken.token : false;

    // Send the current token to the tokens endpoint to delete it
    var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email :false;
    var userQueryStringObject = {
      'email' : email
    }
    app.client.request(tokenId,'api/users','GET',userQueryStringObject,undefined, function(statusCode,responsePayload) {
      var queryStringObject = {
        'orderId' : responsePayload.order
      };
      app.client.request(tokenId,'api/orders','GET',queryStringObject,undefined,function(statusCode,responsePayload) {
        console.log(statusCode, responsePayload);
        // PLEASE CONTINUE HERE //
      })
    })
  }
}

// Bind the logout button
app.bindLogoutButton = function(){
  document.getElementById("logoutButton").addEventListener("click", function(e){

    // Stop it from redirecting anywhere
    e.preventDefault();

    // Log the user out
    app.logUserOut();

  });
};

// Log the user out then redirect them
app.logUserOut = function(redirectUser){
  // Set redirectUser to default to true
  redirectUser = typeof(redirectUser) == 'boolean' ? redirectUser : true;
  console.log(app.config.sessionToken)

  // Get the current token id
  var tokenId = typeof(app.config.sessionToken.token) == 'string' ? app.config.sessionToken.token : false;

  // Send the current token to the tokens endpoint to delete it
  var queryStringObject = {
    'token' : tokenId
  };
  app.client.request(undefined,'api/token','DELETE',queryStringObject,undefined,function(statusCode,responsePayload){
    localStorage.removeItem('token');
    // Set the app.config token as false
    window.location = '/loggedOut';
    app.setSessionToken(false);

    // Send the user to the logged out page
    //if(redirectUser){
    //  window.location = '/loggedOut';
    //}

  });
};


// Bind the forms
app.bindForms = function(){
  if(document.querySelector("form")){

    var allForms = document.querySelectorAll("form");
    for(var i = 0; i < allForms.length; i++){
        allForms[i].addEventListener("submit", function(e){

        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to a previous error)
        document.querySelector("#"+formId+" .formError").style.display = 'none';

        // Hide the success message (if it's currently shown due to a previous error)
        if(document.querySelector("#"+formId+" .formSuccess")){
          document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
        }


        // Turn the inputs into a payload
        var payload = {};
        var elements = this.elements;
        for(var i = 0; i < elements.length; i++){
          if(elements[i].type !== 'submit'){
            // Determine class of element and set value accordingly
            var classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
            var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
            var elementIsChecked = elements[i].checked;
            // Override the method of the form if the input's name is _method
            var nameOfElement = elements[i].name;
            if(nameOfElement == '_method'){
              method = valueOfElement;
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if(nameOfElement == 'httpmethod'){
                nameOfElement = 'method';
              }
              // Create an payload field named "id" if the elements name is actually uid
              if(nameOfElement == 'uid'){
                nameOfElement = 'id';
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              if(classOfElement.indexOf('multiselect') > -1){
                if(elementIsChecked){
                  payload[nameOfElement] = typeof(payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                payload[nameOfElement] = valueOfElement;
              }
            }
          }
        }


        // If the method is DELETE, the payload should be a queryStringObject instead
        var queryStringObject = method == 'DELETE' ? payload : {};

        // Call the API
        app.client.request(undefined,path,method,queryStringObject,payload,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode !== 200){

            if(statusCode == 403){
              // log the user out
              app.logUserOut();

            } else {

              // Try to get the error from the api, or set a default error message
              var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

              // Set the formError field with the error text
              document.querySelector("#"+formId+" .formError").innerHTML = error;

              // Show (unhide) the form error field on the form
              document.querySelector("#"+formId+" .formError").style.display = 'block';
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId,payload,responsePayload);
          }

        });
      });
    }
  }
};

// Form response processor
app.formResponseProcessor = function(formId,requestPayload,responsePayload){
  var functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  if(formId == 'signup'){
    // Take the phone and password, and use it to log the user in
    var newPayload = {
      'email' : requestPayload.email,
      'password' : requestPayload.password
    };

    app.client.request(undefined,'api/token','POST',undefined,newPayload,function(newStatusCode,newResponsePayload){
      // Display an error on the form if needed
      if(newStatusCode !== 200){

        // Set the formError field with the error text
        document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

        // Show (unhide) the form error field on the form
        document.querySelector("#"+formId+" .formError").style.display = 'block';

      } else {

        // If successful, set the token and redirect the user
        app.setSessionToken(newResponsePayload);
        window.location = '/order';
      }
    });
  }
  // If login was successful, set the token in localstorage and redirect the user
  if(formId == 'login'){
    console.log('on login form');
    app.setSessionToken(responsePayload);
    window.location = '/order';
  }

  // If forms saved successfully and they have success messages, show them
  var formsWithSuccessMessages = ['accountEdit1', 'accountEdit2','checksEdit1'];
  if(formsWithSuccessMessages.indexOf(formId) > -1){
    document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if(formId == 'payment') {
    window.location = '/paymentSuccess';
  }

  // If the user just created a new check successfully, redirect back to the dashboard
  if(formId == 'checksCreate'){
    window.location = '/checks/all';
  }

  // If the user just deleted a check, redirect them to the dashboard
  if(formId == 'checksEdit2'){
    window.location = '/checks/all';
  }

};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token){
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem('token',tokenString);
  if(typeof(token) == 'object'){
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function(){
  var tokenString = localStorage.getItem('token');
  if(typeof(tokenString) == 'string'){
    try{
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if(typeof(token) == 'object'){
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    }catch(e){
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

app.paymentOnLoad = function() {
  // Get the current page from the body class
  var bodyClasses = document.querySelector("body").classList;
  var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;
  if (primaryClass == 'pay') {

    var queryString = {
      "email" : app.config.sessionToken.email
    }

    app.client.request(undefined,'api/users','GET',queryString,undefined,function(statusCode, responsePayload){
      document.querySelector('#orderId').value = responsePayload.order
    });
  }
}

// Init (bootstrapping)
app.init = function(){

  // Bind all form submissions
  app.bindForms();

  // Get session token
  app.getSessionToken();

  app.addToCart();

  app.shoppingCart();

  app.paymentOnLoad();

  app.bindLogoutButton();

};

// Call the init processes after the window loads
window.onload = function(){
  app.init();
};

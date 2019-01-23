/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environment = {};

// environment configuration
environment.config = {
  'httpsPort' : 3000,
  'hashingSecret' : 'thisIsASecret',
  'stripeKey' : '',
  'mailgunKey' : {
    'token': '',
    'domain': ''
  }
};

// Export the module
module.exports = environment;

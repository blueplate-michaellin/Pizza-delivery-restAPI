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
  'stripeKey' : 'sk_test_ClHdaa2JasQ8YGNJfJwfulk5'
};

// Export the module
module.exports = environment;

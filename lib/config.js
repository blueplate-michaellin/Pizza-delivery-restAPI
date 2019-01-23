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
  'stripeKey' : 'sk_test_ClHdaa2JasQ8YGNJfJwfulk5',
  'mailgunKey' : {
    'token': 'api: f43dea5d6b05451988b19b26f8540cd9-2d27312c-fe1c5c0a',
    'domain': 'sandbox81cc41c55f0d4d599aee7cef22e365f4.mailgun.org'
  }
};

// Export the module
module.exports = environment;

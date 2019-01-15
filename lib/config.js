/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environment = {};

// environment configuration
environment.config = {
  'httpPort' : 3000,
  'hashingSecret' : 'thisIsASecret',
};

// Export the module
module.exports = environment;

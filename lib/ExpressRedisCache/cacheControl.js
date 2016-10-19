module.exports = (function () {

  'use strict';

  // Convert HTTP status codes into 1xx, 2xx, 3xx, 4xx, 5xx
  function maskStatus (statusCode) {
    return String(statusCode).match(/(\d)\d\d/)[1] + 'xx';
  }

  // Turn the policy argument into a function that consumes a
  // status code and returns the expiration value
  function createCacheControlPolicy (options) {
    if (typeof options !== 'object' && typeof options !== 'string' && typeof options !== 'function') {
      throw new Error('cache control option cannot be type ' + typeof options);
    }

    // If what's passed in is a function, return the function.
    if ( typeof options === 'function' ) {
      return options;
    }

    // Internally store cache control as an object,
    // so if a string is provided, use that as the default
    if ( typeof options === 'string' ) {
      options = {
        'xxx': options
      };
    }

    for (var k in options) {
      // Ensure that keys are in the form xxx, 4xx, or 400
      if (!k.match(/xxx/i) && !k.match(/[1-5]xx/i) && !k.match(/[1-5][0-9]{2}/)) {
        throw new Error('invalid statusCode ' + k);
      }

      // Convert value to array
      if (typeof options[k] !== 'string') {
        throw new Error('invalid cache control for statusCode ' + k);
      }
      
      // Convert keys to lower case
      var v = options[k];
      delete options[v];
      options[k.toLowerCase()] = v;
    }

    // Ensure that there is a default so we can always return a value
    if (!options.hasOwnProperty('xxx')) {
      throw new Error('no default expiration provided');
    }

    var getCacheControlForStatusCode = function(statusCode) {
      // Look for exact status code matches first
      if (options.hasOwnProperty(statusCode)) {
        return options[statusCode];
      }
      // Test for a 4xx style match
      else if (options.hasOwnProperty(maskStatus(statusCode))) {
        return options[maskStatus(statusCode)];
      }
      // Fallback to the default expiration value
      else {
        return options.xxx;
      }
    };

    return function (req, res) {
      var statusCode = res.statusCode;
      return getCacheControlForStatusCode(statusCode);
    };
  }

  return createCacheControlPolicy;
})();

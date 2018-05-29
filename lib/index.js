'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _dns = require('dns');

var _dns2 = _interopRequireDefault(_dns);

var _micromatch = require('micromatch');

var _micromatch2 = _interopRequireDefault(_micromatch);

var _normalizeEmail = require('normalize-email');

var _normalizeEmail2 = _interopRequireDefault(_normalizeEmail);

var _disposableEmailDomains = require('disposable-email-domains');

var _disposableEmailDomains2 = _interopRequireDefault(_disposableEmailDomains);

var _deasync = require('deasync');

var _deasync2 = _interopRequireDefault(_deasync);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Create synchronous function from Node's DNS MX records resolver function
var resolveMx = (0, _deasync2.default)(_dns2.default.resolveMx);

/**
 * Extract the domain from an email.
 *
 * @param {string} email A valid email address
 * @returns {string} Domain part of email
 */
var getDomain = function getDomain(email) {
  return email.substring(email.lastIndexOf('@') + 1);
};

/**
 * Compare an email address against a list of patterns and find a match.
 *
 * @param {string} email Email to match.
 * @param {array} patterns Array of patterns to match. Can be strings, RegExps or glob strings.
 * @param {string} mode Comparison mode. Can be one of 'exact', 'regexp' or 'glob'
 */
var matchEmailDomain = function matchEmailDomain(email, patterns, mode) {
  // Extract domain part from email
  var domain = getDomain(email);

  // Check mode to operate
  if (mode === 'regexp') {
    // Regular expression match:
    return patterns.find(function (item) {
      return item instanceof RegExp ? item.test(domain) : new RegExp(item).test(domain);
    });
  } else if (mode === 'glob') {
    // Glob match
    return _micromatch2.default.any(domain, patterns);
  }

  // Default mode: Check for an exact match
  return patterns.includes(domain);
};

/**
 * Check if a given email address domain has MX records for routing email.
 *
 * @param {string} email Valid email address.
 * @returns {boolean} True if email domain has MX records, false if not.
 */
var validateDomainMx = function validateDomainMx(email) {
  var domain = getDomain(email);

  try {
    var result = resolveMx(domain);
    return !!result.length;
  } catch (err) {
    return false;
  }
};

/**
 * Joi extension definition
 * @param {object} joi
 */
var JoiEmailExtensions = function JoiEmailExtensions(joi) {
  return {
    name: 'string',
    base: joi.string(),

    language: {
      domainPatterns: 'must match one of the patterns',
      nonDisposable: 'must be from a non-disposable email provider',
      noMx: 'must be from a domain that is configured to receive emails'
    },

    rules: [{
      name: 'domains',
      description: function description(params) {
        return 'Email should match one of given domain patterns';
      },

      params: {
        patterns: joi.array(),
        options: joi.object().keys({
          mode: joi.valid(['', 'exact', 'glob', 'regexp']).default('exact')
        }).default()
      },
      validate: function validate(params, value, state, options) {
        if (matchEmailDomain(value, params.patterns, params.options.mode)) {
          return value;
        }

        return this.createError('string.domainPatterns', { value: value }, state, options);
      }
    }, {
      name: 'nonDisposable',
      description: function description(params) {
        return 'Email should be from a disposable email provider';
      },
      validate: function validate(params, value, state, options) {
        if (matchEmailDomain(value, _disposableEmailDomains2.default)) {
          return this.createError('string.nonDisposable', { value: value }, state, options);
        }

        return value;
      }
    }, {
      name: 'normalize',
      description: function description(params) {
        return 'Email should be normalized';
      },
      validate: function validate(params, value, state, options) {
        return (0, _normalizeEmail2.default)(value);
      }
    }, {
      name: 'hasMx',
      description: function description(params) {
        return 'Email domain should have MX records';
      },
      validate: function validate(params, value, state, options) {
        if (!validateDomainMx(value)) {
          return this.createError('string.noMx', { value: value }, state, options);
        }

        return value;
      }
    }]
  };
};

exports.default = JoiEmailExtensions;
'use strict'

import dns from 'dns'
import micromatch from 'micromatch'
import normalizeEmail from 'normalize-email'
import disposableEmailDomains from 'disposable-email-domains'
import deasync from 'deasync'

// Create synchronous function from Node's DNS MX records resolver function
const resolveMx = deasync(dns.resolveMx)

/**
 * Extract the domain from an email.
 *
 * @param {string} email A valid email address
 * @returns {string} Domain part of email
 */
const getDomain = email => email.substring(email.lastIndexOf('@') + 1)

/**
 * Compare an email address against a list of patterns and find a match.
 *
 * @param {string} email Email to match.
 * @param {array} patterns Array of patterns to match. Can be strings, RegExps or glob strings.
 * @param {string} mode Comparison mode. Can be one of 'exact', 'regexp' or 'glob'
 */
const matchEmailDomain = (email, patterns, mode) => {
  // Extract domain part from email
  const domain = getDomain(email)

  // Check mode to operate
  if (mode === 'regexp') {
    // Regular expression match:
    return patterns.find(item => {
      return (item instanceof RegExp)
        ? item.test(domain)
        : (new RegExp(item)).test(domain)
    })
  } else if (mode === 'glob') {
    // Glob match
    return micromatch.any(domain, patterns)
  }

  // Default mode: Check for an exact match
  return patterns.includes(domain)
}

/**
 * Check if a given email address domain has MX records for routing email.
 *
 * @param {string} email Valid email address.
 * @returns {boolean} True if email domain has MX records, false if not.
 */
const validateDomainMx = email => {
  const domain = getDomain(email)

  try {
    const result = resolveMx(domain)
    return !!result.length
  } catch (err) {
    return false
  }
}

/**
 * Joi extension definition
 * @param {object} joi
 */
const JoiEmailExtensions = joi => ({
  name: 'string',
  base: joi.string(),

  language: {
    domainPatterns: 'must match one of the patterns',
    nonDisposable: 'must be from a non-disposable email provider',
    noMx: 'must be from a domain that is configured to receive emails'
  },

  rules: [
    {
      name: 'domains',
      description (params) {
        return 'Email should match one of given domain patterns'
      },
      params: {
        patterns: joi.array(),
        options: joi.object().keys({
          mode: joi.valid(['', 'exact', 'glob', 'regexp']).default('exact')
        }).default()
      },
      validate (params, value, state, options) {
        if (matchEmailDomain(value, params.patterns, params.options.mode)) {
          return value
        }

        return this.createError('string.domainPatterns', { value }, state, options)
      }
    }, {
      name: 'nonDisposable',
      description: params => 'Email should be from a disposable email provider',
      validate (params, value, state, options) {
        if (matchEmailDomain(value, disposableEmailDomains)) {
          return this.createError('string.nonDisposable', { value }, state, options)
        }

        return value
      }
    }, {
      name: 'normalize',
      description: params => 'Email should be normalized',
      validate (params, value, state, options) {
        return normalizeEmail(value)
      }
    }, {
      name: 'hasMx',
      description: params => 'Email domain should have MX records',
      validate (params, value, state, options) {
        if (!validateDomainMx(value)) {
          return this.createError('string.noMx', { value }, state, options)
        }

        return value
      }
    }
  ]
})

export default JoiEmailExtensions

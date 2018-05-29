import BaseJoi from 'joi'
import JoiEmailExtensions from '../src'

const Joi = BaseJoi.extend(JoiEmailExtensions)

test('matches exact domain default mode.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = ['subdomain.domain.com']

  expect(Joi.attempt(value, Joi.string().email().domains(domains))).toBe(value)
})

test('matches domain with mode explicitly set.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = ['subdomain.domain.com']
  const mode = 'exact'

  expect(Joi.attempt(value, Joi.string().email().domains(domains, { mode }))).toBe(value)
})

test('does not match domain if not exact match in exact mode.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = ['domain.com']
  const mode = 'exact'

  expect(() => {
    Joi.attempt(value, Joi.string().email().domains(domains, { mode }))
  }).toThrow('must match one of the patterns')
})

test('matches domain in glob mode with wildcard subdomain.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = ['*.domain.com']
  const mode = 'glob'

  expect(Joi.attempt(value, Joi.string().email().domains(domains, { mode }))).toBe(value)
})

test('matches domain in glob mode with wildcard domain.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = ['subdomain.*.com']
  const mode = 'glob'

  expect(Joi.attempt(value, Joi.string().email().domains(domains, { mode }))).toBe(value)
})

test('matches domain in glob mode with wildcard tld.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = ['subdomain.domain.*']
  const mode = 'glob'

  expect(Joi.attempt(value, Joi.string().email().domains(domains, { mode }))).toBe(value)
})

test('does not match domain in glob mode with domain mismatch.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = ['subdomain.mismatchdomain.*']
  const mode = 'glob'

  expect(() => {
    Joi.attempt(value, Joi.string().email().domains(domains, { mode }))
  }).toThrow('must match one of the patterns')
})

test('matches domain in regexp mode with explicit RegExp.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = [/.*\.domain\.com/]
  const mode = 'regexp'

  expect(Joi.attempt(value, Joi.string().email().domains(domains, { mode }))).toBe(value)
})

test('matches domain in regexp mode with explicit partial RegExp match.', () => {
  const value = 'john.doe@subdomain.domain.com'
  const domains = [/domain\.com/]
  const mode = 'regexp'

  expect(Joi.attempt(value, Joi.string().email().domains(domains, { mode }))).toBe(value)
})

test('throws validation error for matching a known disposable email domain.', () => {
  const value = 'john.doe@mailinator.org'

  expect(() => Joi.attempt(value, Joi.string().email().nonDisposable())).toThrow('must be from a non-disposable email provider')
})

test('does not validate an email from a non-disposable email domain.', () => {
  const value = 'john.doe@google.com'

  expect(Joi.attempt(value, Joi.string().email().nonDisposable())).toBe(value)
})

test('correctly normalizes an email.', () => {
  const value = 'John.Doe@gooGLe.com'
  const normalizedValue = 'john.doe@google.com'

  expect(Joi.attempt(value, Joi.string().email().normalize())).toBe(normalizedValue)
})

test('validates email domain with MX records.', () => {
  const value = 'John.Doe@google.com'

  expect(Joi.attempt(value, Joi.string().email().hasMx())).toBe(value)
})

test('does not validate an email domain missing MX records.', () => {
  const value = 'John.Doe@somedomainwithinvaliddnsrecords.com'

  expect(() => Joi.attempt(value, Joi.string().email().hasMx())).toThrow('must be from a domain that is configured to receive emails')
})

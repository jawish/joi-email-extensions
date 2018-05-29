# joi-email-extensions

> Joi extensions providing email normalization, MX record validation, checking 
for emails from free and disposable email providers and various ways to match 
against a list of email patterns or domains.

## Usage

The methods of this extension are chained after the Joi email validator.

```js
import BaseJoi from 'joi'
import JoiEmailExtensions from 'joi-email-extensions'

const Joi = BaseJoi.extend([JoiEmailExtensions])

const schema = Joi.object().keys({
  // Normalize an email
  normalizedEmail: Joi.string().email().normalize(),

  // Check if email is not from known disposable email provider
  notAThrowAwayEmail: Joi.string().email().nonDisposable(),

  // Validate an email by ensuring the domain has MX records
  mxValidatedEmail: Joi.string().email().hasMx(),

  // Validate only emails from a given exact domain
  exactDomain: Joi.string().email().domains(['mydomain.tld']),

  // Validate email against a list of patterns
  onlyUkEuDomains: Joi.string().email().domains([
    '*.uk',
    '*.eu'
  ], { mode: 'glob' }),

  // Allow emails from domains with the word 'awesome' or 'awful'
  onlyAwesomeDomains: Joi.string().email().domains([
    /awe(some|ful)/
  ], { mode: 'regexp' })
})

const result = schema.validate({
  normalizedEmail: 'someEmaIlAdDress@MydoMaiN.tld',
  notAThrowAwayEmail: 'john.doe@mydomain.tld',
  mxValidatedEmail: 'webmaster@google.com',
  exactDomain: 'john.die@mydomain.tld',
  onlyUkEuDomains: 'john.doe@mydomain.eu',
  onlyAwesomeDomains: 'john.doe@awesome.tld'
})

console.log(result)
// { error: null,
//   value:
//    { normalizedEmail: 'someemailaddress@mydomain.tld',
//      notAThrowAwayEmail: 'webmastere@mydomain.tld',
//      mxValidatedEmail: 'webmaster@google.com',
//      exactDomain: 'john.die@mydomain.tld',
//      onlyUkEuDomains: 'john.doe@mydomain.eu',
//      onlyAwesomeDomains: 'john.doe@awesome.tld' } }
```

## API
### normalize
Transforms email string to a normalized form. Uses [normalize-email](https://www.npmjs.com/package/normalize-email) under the hood.

```js
Joi.string().email().normalize()
```

### nonDisposable
Require the email to be from a domain that is not a known disposable email provider.

```js
Joi.string().email().nonDisposable()
```

### hasMx
Require the email to have valid MX records for handling email.

```js
Joi.string().email().hasMx()
```

### domains(patterns, options)
Require the email to be from a list of domain names. The domain names to match against are passed as the patterns argument and can be specified as exact strings, or glob patterns or regular expressions. The options argument takes an object containing 'mode' with acceptable values of `'exact'` (default), `'regexp'` or `'glob'`.

```js
Joi.string().email().domains(['mydomain.tld'], { mode: 'exact' })
```

## Author
[Jawish Hameed](https://github.com/jawish)

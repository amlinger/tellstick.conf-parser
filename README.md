# tellstick.conf Parser
Parsing tellstick.conf files into Javascript objects.

__Note that this is still very much a work in progress.__

## Installation

```
npm install tellstick.conf-parser
```

## Usage
The parser comes with just a `parse`-method, that accepts a path to your configuration file.

```js
require('tellstick.conf-parser')
  .parse('/etc/tellstick.conf')
  .then(function(obj) {
    // Do stuff with your configuration
  });
```

Remember to restart your Telldus deamon to get the changes in your config activated:
```
[sudo] service telldusd restart
```

## Contribute
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request!

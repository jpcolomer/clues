var clues = require('../clues'),
    Promise = require('bluebird');

function stringifyError(e) {
  return {
    message : e.message,
    ref : e.ref,
    caller : e.caller,
    stack : e.stack,
    error : true
  };
}

function multi(data,self) {
  var res = {};
  data = data.split(',');
  return Promise.all(data
    .map(function(ref) {
      return self.solve(ref)
        .catch(stringifyError)
        .then(function(d) {
          res[ref] = d;
        });
    })
  )
  .then(function() {
    return res;
  });
}

function help(self) {
  return Object.keys(self.logic);
}

module.exports = function(api) {
  api = api || {};
  api.multi = multi;
  api.help = help;

  return function(req,res) {
    res.set('Content-Type','application/json');
    clues(api,req.query)
      .solve(req.param("fn"),{req:req,res:res})
      .catch(stringifyError)
      .then(function(d) {
        if (d && !d.error && req.param('select')) {
          req.param('select')
            .split('.')
            .forEach(function(key) {
              d = d && d[key];
            });
        }
        
        res.end(JSON.stringify(d,null,2));
      });
  };
};
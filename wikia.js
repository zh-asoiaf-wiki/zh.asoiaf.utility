module.exports = (function() {
  var request = require('request');
  // var http = require('http');
  // var _ = require('underscore');
  var BASE = 'http://zh.asoiaf.wikia.com';
  /*
  var options = {
    hostname: BASE, 
    path: '', 
    method: 'GET', 
    agent: false
  };
  */
  var wikia = function() {
  };
  
  wikia.prototype = {
    /*
     * Get page info according to its title
     *
     * callback receives one object argument, defined as, {
     *   url: page url, 
     *   lastEditor: last contributor, 
     *   abstract: abstract provided by api (max length = 500, should be enough), 
     *   picurl: picture selected by api 
     * }
     */
    info: function(title, callback) {
      var url = BASE + '/api/v1/Articles/Details?abstract=500&width=200&height=200&titles=' + title;
      request.get(url, function(err, res, body) {
        if (!err && res.statusCode == 200) {
          var result = JSON.parse(body);
          var items = result.items && result.items;
          var article = null;
          for (var id in items) {
            article = items[id];
            break;
          }
          // if (article.title == title) {
          // }
          if (article) {          
            callback({
              'url': BASE + article.url, 
              // 'lastEditor': article.revision.user, 
              'abstract': article['abstract'], 
              'picurl': article.thumbnail
            });
          } else {
            callback();
          }
        } else if (err) {
          console.log(err.stack);
        } else {
          console.log('Response status: ' + res.statusCode);
        }
      });
    
    
      /*
      var op = _.clone(options);
      op.path = '/api/v1/Articles/Details?abstract=500&width=200&height=200&titles=' + title;
      
      var result = '';
      var req = http.request(op, function(res) {
        res.on('data', function(data) {
          result += data;
        }).on('end', function() {
          result = JSON.parse(result);
          var items = result.items && result.items;
          var article = null;
          for (var id in items) {
            article = items[id];
            break;
          }
          // if (article.title == title) {
          // }
          if (article) {          
            callback({
              'url': BASE + article.url, 
              // 'lastEditor': article.revision.user, 
              'abstract': article['abstract'], 
              'picurl': article.thumbnail
            });
          } else {
            callback();
          }
        });
      });
      req.on('error', function(err) {
        console.log(err);
      });
      req.end();
      */
    }
  };
  
  return wikia;
}());
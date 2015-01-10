module.exports = (function() {
  var request = require('request');
  var BASE = 'http://zh.asoiaf.wikia.com';

  var wikia = function() {
  };
  
  wikia.prototype = {
    /*
     * Get page info according to its title
     *
     * options may be a string (page title) or an object, {
     *   title: page title, 
     *   redirect: a boolean indicates whether to retrieve redirected page 
     * }
     *
     * callback receives one object argument, defined as, {
     *   url: page url, 
     *   lastEditor: last contributor, 
     *   abstract: abstract provided by api (max length = 500, should be enough), 
     *   picurl: picture selected by api 
     * }
     */
    info: function(options, callback) {
      var that = this;
      var title = '';
      var redirect = true;
      if (typeof(options) == 'object') {
        title = options.title;
        redirect = options.redirect;
      } else {
        title = options;
      }
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
            if (redirect) {
              var abstr = article['abstract'];
              var lowAbstr = abstr.toUpperCase();
              if (lowAbstr.startWith('REDIRECT') || lowAbstr.startWith('重定向')) {
                var index = abstr.indexOf(' ') + 1;
                title = abstr.substring(index);
                that.info(title, callback);
                return;
              }
            }
            callback({
              'url': BASE + article.url, 
              // 'lastEditor': article.revision.user, 
              'abstract': article['abstract'], 
              'picurl': article.thumbnail
            });
          } else {
            // TODO: try search
            callback();
          }
        } else if (err) {
          console.log(err.stack);
        } else {
          console.log('Response status: ' + res.statusCode);
        }
      });
    }
  };
  
  /*
   * Utility functions used by wikia.js
   */
  String.prototype.startWith = function(str) {
    if (str == null || str == '' || this.length == 0 || str.length > this.length) return false;
    if (this.substr(0, str.length) ==str) return true; else return false;
    return true;
  };
  
  return wikia;
}());
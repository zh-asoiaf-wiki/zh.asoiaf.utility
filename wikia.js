module.exports = (function() {
  var request = require('request');
  var Dict = require('./dict.js');  
  
  var BASE = 'http://zh.asoiaf.wikia.com';
  var SORT_THRESHOLD = 80;

  var wikia = function() {
    this.dict = new Dict();
    this.dict.exist();
  };
  
  wikia.prototype = {
    /*
     * Get page info according to its title
     *
     * callback(err, obj) receives one object argument, defined as, {
     *   url: page url, 
     *   lastEditor: last contributor, 
     *   abstract: abstract provided by api (max length = 500, should be enough), 
     *   picurl: picture selected by api 
     * }
     */
    info: function(title, callback) {
      var that = this;
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
          if (article) { 
            var abstr = article['abstract'];
            var lowAbstr = abstr.toUpperCase();
            if (lowAbstr.startWith('REDIRECT') || lowAbstr.startWith('重定向')) {
              var index = abstr.indexOf(' ') + 1;
              title = abstr.substring(index);
              that.info(title, callback);
            } else {
              callback('', {
                'url': BASE + article.url, 
                // 'lastEditor': article.revision.user, 
                'abstract': article['abstract'], 
                'picurl': article.thumbnail
              });
            }
          } else {
            callback();
          }
        } else if (err) {
          console.log(err.stack);
          callback(err);
        } else {
          errStatusCode(res.statusCode, callback);
        }
      });
    }, 
    /*
     * Try search if no page matched for such title (key)
     *
     * callback(err, obj) receives one array argument, each element is an object, defined as, {
     *   title: title of the page
     *   url: page url, 
     *   picurl: picture selected by api 
     * }
     */
    search: function(key, callback) {
      var that = this;
      var url = BASE + '/api/v1/Search/List?limit=10&minArticleQuality=1&namespace=0%2C14&query=' + key;
      request.get(url, function(err, res, body) {
        /*
         * 404 indicates no results; 200 otherwise.
         */
        if (err) {
          callback(err);
        } else if (res.statusCode == 404) {
          callback('', []);
        } else if (res.statusCode == 200) {
          var items = JSON.parse(body).items;
          var articles = [];
          if (items) {
            // sort original results
            items.sort(function(a, b) {
              var acontain = (a.title.indexOf(key) != -1);
              var bcontain = (b.title.indexOf(key) != -1);
              if (acontain == bcontain) {
                return a.quality < b.quality;
              } else if (acontain && a.quality > SORT_THRESHOLD) {
                return -1;
              } else if (bcontain && b.quality > SORT_THRESHOLD) {
                return 1;
              } else {
                return a.quality < b.quality;
              }
            });
            
            // fetch pics
            url = BASE + '/api/v1/Articles/Details?abstract=0&width=200&height=200&ids=';
            for (var i = 0; i < items.length; ++i) {
              url += items[i].id + ',';
            }
            request.get(url, function(err, res, body) {
              if (err) {
                callback(err);
              } else if (res.statusCode != 200) {
                errStatusCode(res.statusCode, callback);
              } else {
                var result = JSON.parse(body);
                var needMore = false;
                for (var i = 0; i < items.length; ++i) {
                  items[i].picurl = result.items[items[i].id].thumbnail;
                  !items[i].picurl && (needMore = true);
                }
                if (needMore) {
                  that._getPics(items, callback);
                }
                // callback('', items);
              } 
            });
          } else {
            // No result. => This maybe an Exception because a 404 will be reponsed if no results exist.
            callback('', []);
          }
        } else {
          errStatusCode(res.statusCode, callback);
        }
      });
    }, 
    /*
     * private functions
     */
    _getPics: function(items, callback) {
      var url = BASE + '/api/v1/Articles/Details?abstract=0&width=200&height=200&titles=';
      for (var i = 0; i < items.length; ++i) {
        if (!items[i].picurl) {
          var title = items[i].title;
          // 1. if contains '·'
          var idx = title.indexOf('·');
          if (idx != -1) {
            // 2. get zh family name
            var zhHouse = title.substring(idx + 1) + '家族';
            // 3. get en family name
            var enHouse = this.dict.getByZh(zhHouse);
            // 4. get file name
            enHouse = enHouse && ('File:' + enHouse + '.png').replace(' ', '_');
            // 5. add to query string
            url += enHouse + ',';
          }
        }
      }
      // 6. get pics directly
      request.get(url, function(err, res, body) {
        if (err) {
          callback(err);
        } else if (res.statusCode != 200) {
          errStatusCode(res.statusCode, callback);
        } else {
          var pics = JSON.parse(body).items;
          for (var i = 0; i < items.length; ++i) {
            if (pics[items[i].id]) {
              items[i].picurl = pics[items[i].id].thumbnail;
            } else {
              // TODO: if still no pic...
            }
          }
          callback('', items);
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
  var errStatusCode = function(statusCode, callback) {
    var err = 'response statusCode = ' + statusCode;
    callback(err);
  };
  
  return wikia;
}());
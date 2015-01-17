module.exports = (function() {
  var request = require('request');
  var _ = require('underscore');
  var Dict = require('./dict.js');
  var Quote = require('./quote.js');
  
  var BASE = 'http://zh.asoiaf.wikia.com';
  var SORT_THRESHOLD = 80;

  var wikia = function() {
    this.dict = new Dict();
    this.dict.exist();
    
    this.quotes = new Quote();
    this.quotes.exist();
  };
  
  wikia.prototype = {
    /*
     * Get details about a page with a given title.
     *
     * input o, defined as, {
     *   title: title of the page, 
     *   abstract: length of the abstract returned, 500 by default, 
     *   width: width of its thumbnail, 200 by default, 
     *   height: height of its thumbnail, 200 by default
     * }
     *
     * callback(err, info) receives one object argument, described on: 
     * http://zh.asoiaf.wikia.com/api/v1#!/Articles/getDetails_get_1
     */
    info: function(o, callback) {
      var that = this;
      var title = o.title || o;
      var abstr = o['abstract'] || 500;
      var width = o.width || 200;
      var height = o.height || 200;
      var url = BASE + '/api/v1/Articles/Details?abstract=' + abstr 
        + '&width=' + width
        + '&height=' + height
        + '&titles=' + title;
      request.get(url, function(err, res, body) {
        if (!err && res.statusCode == 200) {
          var items = JSON.parse(body).items;
          var article = null;
          for (var id in items) {
            article = items[id];
            break;
          }
          if (article) {
            // handle redirection
            var abstr = article['abstract'];
            var upAbstr = abstr.toUpperCase();
            if (upAbstr.startWith('REDIRECT') || upAbstr.startWith('重定向')) {
              var index = abstr.indexOf(' ') + 1;
              title = abstr.substring(index);
              // recursion
              // TODO: a redirection loop will raise an exception
              that.info(title, callback);
            } else {
              article.url = BASE + article.url;
              callback('', article);
            }
          } else {
            callback();
          }
        } else if (err) {
          callback(err);
        } else {
          errStatusCode(res.statusCode, callback);
        }
      });
    }, 
    /*
     * Get details about pages with given titles.
     *
     * input o, defined as, {
     *   titles: array of titles of these pages, 
     *   abstract: length of the abstract returned, 500 by default, 
     *   width: width of its thumbnail, 200 by default, 
     *   height: height of its thumbnail, 200 by default
     * }
     *
     * callback(err, infos) receives an array of objects, described on: 
     * http://zh.asoiaf.wikia.com/api/v1#!/Articles/getDetails_get_1
     */    
    infos: function(o, callback) {
      // return infos according to the original sequence
      // same pages (after redirection handling) will only occupy one element in the array
      var ret = function(titles, items) {
        var res = [];
        _.each(titles, function(title) {
          var v = items[title];
          while (_.isString(v)) {
            v = items[v];
          }
          res.push(v);
        });
        return _.uniq(res);
      };
    
      var that = this;
      if (_.isString(o)) {
        o = { titles: [ o ] };
      } else if (_.isArray(o)) {
        o = { titles: o };
      }
      o['abstract'] = o['abstract'] || 500;
      o.width = o.width || 200;
      o.height = o.height || 200;
      o.depth = o.depth || 0; // recursion depth
      var url = BASE + '/api/v1/Articles/Details?abstract=' + o['abstract'] 
        + '&width=' + o.width
        + '&height=' + o.height
        + '&titles=' + appendQuery(o.titles);
      request.get(url, function(err, res, body) {
        if (!err && res.statusCode == 200) {
          var items = JSON.parse(body).items;
          var retitles = []; // array of titles of redirected pages
          _.each(items, function(article) {
            // handle redirection
            var abstr = article['abstract'];
            var upAbstr = abstr.toUpperCase();
            if (upAbstr.startWith('REDIRECT') || upAbstr.startWith('重定向')) {
              var index = abstr.indexOf(' ') + 1;
              var title = abstr.substring(index);
              retitles.push(title);
              items[article.title] = title;
            } else {
              article.url = BASE + article.url;
              items[article.title] = article;
            }
          });
          if (retitles.length > 0) {
            var no = _.clone(o);
            no.titles = retitles;
            ++no.depth;
            that.infos(no, function(err, infos) {
              _.extend(items, infos);
              if (--no.depth > 0) {
                callback('', items);
              } else {
                callback('', ret(o.titles, items));
              }
            });
          } else {
            if (o.depth > 0) {
              callback('', items);
            } else {
              callback('', ret(o.titles, items));
            }
          }
        } else if (err) {
          callback(err);
        } else {
          errStatusCode(res.statusCode, callback);
        }
      });
    }, 
    /*
     * Search pages by a given key.
     * 1. Search relevant pages by query key
     * 2. Get details about these results, abstract, thumbnail, etc...
     * 3. Handle pages with no explicit thumbnail
     *
     * input o, defined as, { 
     *   key: query key, 
     *   limit: number of results, 10 by default, 
     *   quality: minimum of article quality, 1 by default (get every pages), 
     *   namespace: search under which namespace, '0%2C14' by default, 
     *   info: options used to get details about these results, defined as above
     * }
     *
     * callback(err, obj) receives one array argument, each element is an object, described on: 
     * http://zh.asoiaf.wikia.com/api/v1#!/Search/getList_get_0 and combined with
     * http://zh.asoiaf.wikia.com/api/v1#!/Articles/getDetails_get_1
     * }
     */
    search: function(o, callback) {
      var that = this, 
          key = o.key || o, 
          limit = o.limit || 10, 
          quality = o.quality || 1, 
          namespace = o.namespace || '0%2C14', 
          info = o.info || { 'abstract': 500, 'width': 200, 'height': 200 };
      !info['abstract'] && (info['abstract'] = 500);
      !info.width && (info.width = 200);
      !info.height && (info.height = 200);
      var url = BASE + '/api/v1/Search/List?limit=' + limit 
        + '&minArticleQuality=' + quality 
        + '&namespace=' + namespace 
        + '&query=' + key;
      request.get(url, function(err, res, body) {
        // 404 indicates no results; 200 otherwise.
        if (err) {
          callback(err);
        } else if (res.statusCode == 404) {
          callback('', []);
        } else if (res.statusCode == 200) {
          var items = JSON.parse(body).items;
          var articles = [];
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
          
          // get details of these results
          url = BASE + '/api/v1/Articles/Details?abstract=' + info['abstract'] 
            + '&width=' + info.width 
            + '&height=' + info.height 
            + '&ids=';
          for (var i = 0; i < items.length; ++i) {
            url += items[i].id + ',';
          }
          request.get(url, function(err, res, body) {
            if (err) {
              callback(err);
            } else if (res.statusCode != 200) {
              errStatusCode(res.statusCode, callback);
            } else {
              var result = JSON.parse(body), 
                  needMore = false;
              for (var i = 0; i < items.length; ++i) {
                var o = result.items[items[i].id];
                items[i]['abstract'] = o['abstract']
                var thumbnail = o.thumbnail;
                if (thumbnail) {
                  items[i].thumbnail = thumbnail;
                  items[i]['original_dimensions'] = o['original_dimensions'];
                } else {
                  needMore = true;
                }
              }
              // to fetch more pics
              if (needMore) {
                that._getPics(info, items, callback);
              } else {
                callback('', items);
              }
            } 
          });
        } else {
          errStatusCode(res.statusCode, callback);
        }
      });
    }, 
    /*
     * Try get thumbnail of those pages without explicit thumbnail.
     *
     * Rules: 
     * 1. '某某·拜拉席恩' => '拜拉席恩家族' = (via dict) > 'House Baratheon' => 'File:House_Baratheon.png' => get pic
     * TODO...
     */
    _getPics: function(o, items, callback) {
      var url = BASE + '/api/v1/Articles/Details?abstract=0&width=' + o.width 
        + '&height=' + o.height 
        + '&titles=';
      var marks = [];
      for (var i = 0; i < items.length; ++i) {
        if (!items[i].thumbnail) {
          var title = items[i].title;
          // 1. if contains '·'
          var idx = title.indexOf('·');
          var endIdx = title.indexOf('(', idx);
          if (idx != -1) {
            // 2. get zh family name
            var zhHouse = ((endIdx == -1) 
              ? (title.substring(idx + 1) + '家族') 
              : (title.substring(idx + 1, endIdx) + '家族'));
            // 3. get en family name
            var enHouse = this.dict.getByZh(zhHouse);
            if (enHouse) {
              enHouse += '.png';
              // add mark
              marks.push(enHouse);
              // 4. get file name
              enHouse = ('File:' + enHouse).replace(' ', '_');
              // 5. add to query string
              url += enHouse + ',';
            } else {
              marks.push(undefined);
            }
          } else {
            marks.push(undefined);
          }
        } else {
          marks.push(undefined);
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
          // map pics to picurls
          var pic2url = {};
          for (var i in pics) {
            var pic = pics[i];
            pic2url[pic.title] = {
              'thumbnail': pic.thumbnail, 
              'original_dimensions': pic['original_dimensions']
            };
          }
          // replace mark with picurl
          for (var i = 0; i < items.length; ++i) {
            var mark = marks[i];
            if (mark) {
              var picurl = pic2url[mark];
              if (picurl) {
                items[i].thumbnail = picurl.thumbnail;
                items[i]['original_dimensions'] = picurl['original_dimensions'];
              }
            }
          }
          callback('', items);
        }
      });
    }, 
    /***********************
     * Advanced features...
     ************************/
    /*
     * Get one featured quote. 
     *
     * callback receives one object argument, defined as, {
     *   quote: content of the quote, 
     *   items: array of objects about related pages, described on: 
     *   http://zh.asoiaf.wikia.com/api/v1#!/Articles/getDetails_get_1
     * }
     */
    quote: function(callback) {
      var q = this.quotes.get(), 
          k, v;
      for (k in q) {
        v = q[k];
      }
      this.infos(v, function(err, infos) {
        if (err) {
          callback(err);
        } else {
          callback('', {
            quote: q, 
            items: infos
          });
        }
      });
    }, 
    doYouKnow: function(callback) {
    }
  };
  
  /*************************************
   * Utility functions used by wikia.js
   *************************************/
  /*
   * implode array and seperating each elements with delimiter. 
   *
   * E.g., appendQuery([one, two], ',') will return 'one,two,'
   */
  var appendQuery = function(array, delimiter) {
    delimiter = delimiter || ',';
    var str = '';
    if (array) {
      for (var i = 0; i < array.length; ++i) {
        str += array[i] + delimiter;
      }
      return str;
    } else {
      return '';
    }
  };
  /*
   * Transfer an object into an array. Will not ignore undefined value.
   *
   * obj2arr({ '1': { 'title': 'one' }, '2': undefined, '3': { 'title': 'three' }}) will return:
   * [ { 'title': 'one' }, undefined, { 'title': 'three' } ]
   */
  var obj2arr = function(o) {
    var arr = [];
    for (var e in o) {
      arr.push(o[e]);
    }
    return arr;
  };
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
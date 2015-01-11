module.exports = (function() {
  var request = require('request');
  var fs = require('fs');
  
  var dict = function() {
    this.enzh = undefined;
    this.zhen = undefined;
  };
  
  dict.prototype = {
    getByZh: function(zh) {
      return this.zhen[zh];
    }, 
    getByEn: function(en) {
      return this.enzh[en];
    }, 
    exist: function() {
      if (this.enzh) {
        !this.zhen && (this.zhen = flip(this.enzh));
        this.isStale() && this.fetch();
        return true;
      } else {
        if (fs.existsSync('dict-enzh.json')) {
          this.enzh = JSON.parse(fs.readFileSync('./dict-enzh.json', { encoding: 'utf-8' }));
          this.zhen = flip(this.enzh);
          this.isStale() && this.fetch();
          return true;
        } else {
          this.fetch();
          return false;
        }
      }
    }, 
    isStale: function() {
      var addZero = function(num) {
        return (num < 10) ? '0' + num : '' + num;
      }
      var d = new Date();
      var now = '' + d.getUTCFullYear() + addZero(d.getUTCMonth() + 1) + addZero(d.getUTCDate()); 
      var ts = this.enzh['__TIMESTAMP__'];
      return (now - ts > 0);
    }, 
    fetch: function() {
      var that = this;
      request.get('http://zh.asoiaf.wikia.com/api.php?action=query&prop=revisions&rvprop=content&titles=MediaWiki:Common.js/dict&format=json', function(err, res, body) {
        var result = JSON.parse(body);
        var dictStr = result.query.pages['15606'].revisions[0]['*'];  // 15606 is page id of MediaWiki:Common.js/dict
        that.enzh = JSON.parse(dictStr.substring(16)); // jump over 'var MAIN_DICT = '
        that.zhen = flip(that.enzh);
        that.write();
      });
    }, 
    write: function() {
      fs.writeFile('dict-enzh.json', JSON.stringify(this.enzh));
      fs.writeFile('dict-zhen.json', JSON.stringify(this.zhen));
    }
  };
  
  var flip = function(o) {
    if (o) {
      var fo = {};
      for (var key in o) {
        fo[o[key]] = key;
      }
      return fo;
    }
  };
  
  return dict;
}());
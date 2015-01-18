module.exports = (function() {
  var request = require('request');
  var _ = require('underscore');
  var fs = require('fs');
  var util = require('./util.js');
      
  var Quote = function() {
  };
  
  Quote.prototype = {
    get: function() {
      return this.data[_.random(this.data.length)];
    }, 
    exist: function() {
      if (this.data) {
        this.isStale() && this.fetch();
        return true;
      } else {
        if (fs.existsSync('quote.json')) {
          this.data = JSON.parse(fs.readFileSync('quote.json'));
          var stat = fs.statSync('quote.json');
          this.isStale(stat.mtime) && this.fetch();
          return true;
        } else {
          this.fetch();
          return false;
        }
      }
    }, 
    isStale: function(date) {
      if (!date) {
        if (!this.timestamp) {
          return true;
        } else {
          var now = util.dateStr(new Date());
          return (now - this.timestamp > 0);
        }
      } else {
        var now = util.dateStr(new Date());
        var ts = util.dateStr(date);
        return (now - ts > 0);
      }
    },     
    fetch: function() {
      var that = this;
      var url = 'http://zh.asoiaf.wikia.com/api.php?action=query&prop=revisions&rvprop=content&titles=Template:Featured%20Quote/json&format=json';
      request.get(url, function(err, res, body) {
        var result = JSON.parse(body);
        var quoteStr = result.query.pages['39215'].revisions[0]['*'];  // 39215 is page id of Template:Featured_Quote/json
        that.data = JSON.parse(quoteStr);
        that.timestamp = util.dateStr(new Date());
        that.write();
      });
    }, 
    write: function() {
      fs.writeFile('quote.json', JSON.stringify(this.data));
    }
  };
  
  return Quote;
}());
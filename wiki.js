module.exports = (function() {
  var bot = require('nodemw');
  
  var wiki = function(options) {
    this.config = config = options.config;
    /* 
     * config is an object by default, 
     * we assume the account is a bot
     */
     this.client = new bot(config);
   };
   
   wiki.prototype = {
     tryBot: function(callback) {
       if (this.isLogin !== true) {
         var that = this;
         this.client.logIn(function() {
           that.isLogin = true;
           callback();
         });
       } else {
         callback();
       }
     }
   };
   
   return wiki;
 }());
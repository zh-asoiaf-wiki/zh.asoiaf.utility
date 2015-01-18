/*
 * Plan to depreciate
 */
module.exports = (function() {
  var bot = require('nodemw');
  
  var Wiki = function(options) {
    this.config = config = options.config;
    /* 
     * config is an object by default, 
     * we assume the account is a bot
     */
     this.client = new bot(config);
   };
   
   Wiki.prototype = {
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
   
   return Wiki;
 }());
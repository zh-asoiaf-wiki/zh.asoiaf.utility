var Wikia = require('../wikia.js');
var wikia = new Wikia();
var should = require('should');

describe('info()', function() {
  it('when precise title is provided', function() {
    wikia.info('詹姆·兰尼斯特', function(err, info) {
      info.should.have.property('url', 'http://zh.asoiaf.wikia.com/wiki/詹姆·兰尼斯特');
    });
  });
  it('when title points to a redirected page', function() {
    wikia.info('琼恩', function(err, info) {
      info.should.have.property('url', 'http://zh.asoiaf.wikia.com/wiki/琼恩(消歧义)');
    });
  });
});

describe('search()', function() {
  it('when 400 responsed', function() {
    wikia.search('', function(err, items) {
      err.should.equal('response statusCode = 400');
    });
  });
  it('when no results exist', function() {
    wikia.search('tiliang', function(err, items) {
      should.not.exist(err);
      items.should.equal([]);
    }); 
  });
  it('when results responsed', function() {
    wikia.search('伊耿', function(err, items) {
      should.not.exist(err);
      items.should.not.equal([]);
    });
  });
});

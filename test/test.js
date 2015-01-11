var Wikia = require('../wikia.js');
var wikia = new Wikia();

describe('info()', function() {
  it('when precise title is provided', function(done) {
    wikia.info('詹姆·兰尼斯特', function(err, info) {
      info.should.have.property('url', 'http://zh.asoiaf.wikia.com/wiki/%E8%A9%B9%E5%A7%86%C2%B7%E5%85%B0%E5%B0%BC%E6%96%AF%E7%89%B9');
      done();
    });
  });
  it('when title points to a redirected page', function(done) {
    wikia.info('琼恩', function(err, info) {
      info.should.have.property('url', 'http://zh.asoiaf.wikia.com/wiki/%E7%90%BC%E6%81%A9(%E6%B6%88%E6%AD%A7%E4%B9%89)');
      done();
    });
  });
});

describe('search()', function() {
  it('when 400 responsed', function(done) {
    wikia.search('', function(err, items) {
      err.should.equal('response statusCode = 400');
      done();
    });
  });
  it('when no results exist', function(done) {
    wikia.search('tiliang', function(err, items) {
      err.should.equal('');
      items.length.should.equal(0);
      done();
    }); 
  });
  it('when results responsed', function(done) {
    wikia.search('丹尼斯', function(err, items) {
      err.should.equal('');
      items.should.not.equal([]);
      done();
    });
  });
});

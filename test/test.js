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
    wikia.info('泰温', function(err, info) {
      info.should.have.property('url', 'http://zh.asoiaf.wikia.com/wiki/%E6%B3%B0%E6%B8%A9%C2%B7%E5%85%B0%E5%B0%BC%E6%96%AF%E7%89%B9');
      done();
    });
  });
});

describe('infos()', function() {
  it('when only one title is provided', function(done) {
    wikia.infos('凯冯·兰尼斯特', function(err, infos) {
      infos[0].should.have.property('url', 'http://zh.asoiaf.wikia.com/wiki/%E5%87%AF%E5%86%AF%C2%B7%E5%85%B0%E5%B0%BC%E6%96%AF%E7%89%B9');
      done();
    });
  });
  it('when only one redirecting title is provided', function(done) {
    wikia.infos([ '伊耿·坦格利安' ], function(err, infos) {
      infos[0].should.have.property('url', 'http://zh.asoiaf.wikia.com/wiki/%E4%BC%8A%E8%80%BF%C2%B7%E5%9D%A6%E6%A0%BC%E5%88%A9%E5%AE%89%E4%B8%80%E4%B8%96');
      done();
    });
  });
  it('when only one double-redirecting title is provided', function(done) {
    wikia.infos([ '明焰伊利昂' ], function(err, infos) {
      infos[0].should.have.property('url', 'http://zh.asoiaf.wikia.com/wiki/%E4%BC%8A%E5%88%A9%E6%98%82%C2%B7%E5%9D%A6%E6%A0%BC%E5%88%A9%E5%AE%89(%E6%A2%85%E5%8D%A1%E4%B8%80%E4%B8%96%E4%B9%8B%E5%AD%90)');
      done();
    });
  });
  it('when titles are provided', function(done) {
    wikia.infos([ '琼恩·雪诺', '伊蒙·坦格利安(梅卡一世之子)', '徒利家族', '伊耿·坦格利安一世' ], function(err, infos) {
      infos.length.should.equal(4);
      infos[0].should.have.property('id', 217);
      infos[1].should.have.property('id', 107);
      infos[2].should.have.property('id', 1601);
      infos[3].should.have.property('id', 2769);
      done();
    });
  });
  it('when multiple redirecting titles are provided', function(done) {
    wikia.infos([ '琼恩', '伊蒙学士', '徒利家族', '伊耿·坦格利安' ], function(err, infos) {
      infos.length.should.equal(4);
      infos[0].should.have.property('id', 217);
      infos[1].should.have.property('id', 107);
      infos[2].should.have.property('id', 1601);
      infos[3].should.have.property('id', 2769);
      done();
    });
  });
  it('when multiple double-redirecting titles are provided', function(done) {
    wikia.infos([ '琼恩', '明焰伊利昂', '伊蒙学士', '伊蒙·坦格利安(梅卡一世之子)', '破矛者贝勒', '徒利家族' ], function(err, infos) {
      infos.length.should.equal(5);
      infos[0].should.have.property('id', 217);
      infos[1].should.have.property('id', 4178);
      infos[2].should.have.property('id', 107);
      infos[3].should.have.property('id', 3402);
      infos[4].should.have.property('id', 1601);
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

describe('quote()', function() {
  it('quote()', function(done) {
    wikia.quote(function(err, items) {
      err.should.equal('');
      done();
    });
  });
});

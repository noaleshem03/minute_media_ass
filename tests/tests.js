const chai = require('chai');
const assert = require('chai').assert;
const chaiHttp = require('chai-http');
const server = require('../app');
const should = chai.should();

chai.use(chaiHttp);


//test server
describe('/GET matches by team', () => {
  it('it should GET all the matches with requested team', (done) => {
    chai.request(server)
        .get('/matches?team=Liverpool')
        .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(41);
          done();
        });
  });

  it('it should GET all the matches with requested team', (done) => {
    chai.request(server)
        .get('/matches?team=Tottenham Hotspur')
        .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(42);
          done();
        });
  });
});

describe('/GET matches by team filtered by status', () => {
  it('it should GET all the matches with requested team and requested status', (done) => {
    chai.request(server)
        .get('/matches?team=Liverpool&status=upcoming')
        .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(12);
          done();
        });
  });

  it('it should GET all the matches with requested team and requested status', (done) => {
    chai.request(server)
        .get('/matches?team=Liverpool&status=played')
        .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(29);
          done();
        });
  });
});

describe('/GET matches by tournament', () => {
  it('it should GET all the matches with requested tournament', (done) => {
    chai.request(server)
        .get('/matches?tournament=fa')
        .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(142);
          done();
        });
  });

  it('it should GET all the matches with requested tournament', (done) => {
    chai.request(server)
        .get('/matches?tournament=premier-league')
        .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(379);
          done();
        });
  });
});

describe('/GET matches by tournament filtered by status', () => {
  it('it should GET all the matches with requested tournament and requested status', (done) => {
    chai.request(server)
        .get('/matches?tournament=premier-league&status=upcoming')
        .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(120);
          done();
        });
  });

  it('it should GET all the matches with requested tournament and requested status', (done) => {
    chai.request(server)
        .get('/matches?tournament=premier-league&status=played')
        .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(259);
          done();
        });
  });
});

describe('/GET matches - invalid parameters', () => {
  it('zero parameters', (done) => {
    chai.request(server)
        .get('/matches')
        .end((err, res) => {
              res.should.have.status(400);
              res.body.message.should.be.eql('Bad query, please enter parameters');
          done();
        });
  });

  it('3 parameters', (done) => {
    chai.request(server)
        .get('/matches?team=Liverpool&tournament=premier-league&status=played')
        .end((err, res) => {
              res.should.have.status(400);
              res.body.message.should.be.eql('Bad query, please enter at most 2 parameters');
          done();
        });
  });

  it('team and tournament in the same query', (done) => {
    chai.request(server)
        .get('/matches?team=Liverpool&tournament=premier-league')
        .end((err, res) => {
              res.should.have.status(400);
              res.body.message.should.be.eql('Bad query, please enter team name or tournament name');
          done();
        });
  });

  it('invalid team name', (done) => {
    chai.request(server)
        .get('/matches?team=dddddd')
        .end((err, res) => {
              res.should.have.status(500);
              res.body.message.should.be.eql('Invalid team name, please enter again');
          done();
        });
  });

  it('invalid tournament name', (done) => {
    chai.request(server)
        .get('/matches?tournament=dddddd')
        .end((err, res) => {
              res.should.have.status(500);
              res.body.message.should.be.eql('Invalid tournamnet name, please enter again');
          done();
        });
  });

  it('invalid status type', (done) => {
    chai.request(server)
        .get('/matches?tournament=Liverpool&status=ddddd')
        .end((err, res) => {
              res.should.have.status(500);
              res.body.message.should.be.eql('Invalid status type, please enter again');
          done();
        });
  });
});
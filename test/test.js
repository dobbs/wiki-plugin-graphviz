// build time tests for graphviz plugin
// see http://mochajs.org/

(function() {
  const graphviz = require('../client/graphviz'),
        expect = require('expect.js');

  describe('graphviz plugin', () => {
    describe('expand', () => {
      it('can make itallic', () => {
        var result = graphviz.expand('hello *world*');
        return expect(result).to.be('hello <i>world</i>');
      });
    });

    describe('authors can convert algorithmic diagrams into static diagrams', () => {
      context('when text omits both DOT and STATIC', () => {
        // static diagram
      }) ;
      context('when text contains DOT and omits STATIC', () => {
        // algorithmic diagram
      }) ;
      context('when text contains both DOT and STATIC', () => {
        // hopefully we can prevent this case
        // or just clean it up by removing the STATIC block
      }) ;
      context('when text contains omits DOT and contains STATIC', () => {
        // hopefully we can prevent this case or just clean it up by
        // removing the STATIC keyword and preserving the remaining
        // content
      }) ;
    });
  });

}).call(this);

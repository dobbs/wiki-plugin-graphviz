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
  });

}).call(this);

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
        const item = {
          type: "graphviz",
          text: `strict digraph { A -> {B C} -> D }`
        };
        it('preserves existing text', () => {
          const result = graphviz.includeStaticDotInText(item);
          return expect(result.text).to.equal(item.text);
        });
      }) ;
      context('when text contains DOT and omits STATIC', () => {
        // algorithmic diagram
        const item = {
          type: "graphviz",
          text: `DOT FROM about-graphviz-plugin`,
          dot: `digraph {
"Welcome Visitors"->"Recent Changes"
"Welcome Visitors"->"Local Changes"
}`
        };
        it('appends a STATIC block to existing text', () => {
          const result = graphviz.includeStaticDotInText(item);
          expect(result.text).to.contain(item.text);
          expect(result.text).to.contain('STATIC');
          expect(result.text).to.contain(item.dot);
        });
        it('appends only one STATIC block to existing text', () => {
          const result = graphviz.includeStaticDotInText(item);
          const statics = result.text.match(/(STATIC)/g);
          expect(statics.length).to.equal(1);
        });
      }) ;
      context('when text contains both DOT and STATIC', () => {
        // remove the STATIC block and preserve algorithm
        const item = {
          type: "graphviz",
          text: `DOT FROM about-graphviz-plugin

STATIC

strict digraph { A -> B -> C}`,
          dot: `digraph {
"Welcome Visitors"->"Recent Changes"
"Welcome Visitors"->"Local Changes"
}`
        };
        it('recalculates the STATIC block', () => {
          const result = graphviz.includeStaticDotInText(item);
          expect(result.text).to.contain(item.text);
          expect(result.text).to.contain('STATIC');
          expect(result.text).to.contain(item.dot);
        });
        it('appends only one STATIC block to existing text', () => {
          const result = graphviz.includeStaticDotInText(item);
          const statics = result.text.match(/(STATIC)/g);
          expect(statics.length).to.equal(1);
        });

      }) ;
      }) ;
      context('when text omits DOT and contains STATIC', () => {
        // remove the STATIC keyword and preserve remaining content
    });
  });

}).call(this);

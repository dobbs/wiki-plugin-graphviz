// build time tests for graphviz plugin
// see http://mochajs.org/

(function() {
  const graphviz = require('../client/graphviz'),
        expect = require('expect.js');

  describe('graphviz algorithmic drawing', () => {

    describe('tree', () => {
      it('can nest one line', () => {
        var result = JSON.stringify(graphviz.tree(['HERE'],[],0));
        return expect(result).to.be(JSON.stringify(['HERE']));
      });
      it('can nest indented lines', () => {
        var result = JSON.stringify(graphviz.tree(['HERE',' THERE'],[],0));
        return expect(result).to.be(JSON.stringify(['HERE',['THERE']]));
      });
      it('can nest in and out again', () => {
        var result = JSON.stringify(graphviz.tree(['HERE',' THERE','THEN'],[],0));
        return expect(result).to.be(JSON.stringify(['HERE',['THERE'],'THEN']));
      });
    });

    describe('evalTree', () => {
      const page = {title:'This Page',story:[],journal:[]}
      var context = {
        name: page.title,
        site: 'localhost',
        page,
        want: page.story.slice()
      }
      it('can pass dot markup', async () => {
        const result = await graphviz.evalTree(['node [shape=box]'],context,[])
        return expect(result[0]).to.be('node [shape=box]');
      });

      it('can display a node', async () => {
        const result = await graphviz.evalTree(['HERE NODE'],context,[])
        return expect(result[0]).to.be('"This\nPage"');
      });

    });


  });

}).call(this);


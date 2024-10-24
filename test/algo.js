// build time tests for graphviz plugin
// see http://mochajs.org/

(function() {
  const graphviz = require('../client/graphviz'),
        expect = require('expect.js');
  const federation = {
    'fed.wiki': {
      'this-page': {
        title:'This Page',
        story:[
          {type:'paragraph',text:'[[That Page]]'},
          {type:'paragraph',text:'[[Missing Page]]'},
          {type:'paragraph',text:'See also [[Special Page]]'},
          {type:'graph',text:'World --> HERE'},
          {type:'pagefold',text:'wanted'},
          {type:'paragraph',text:'[[Want This]]'},
          {type:'paragraph',text:'[[Want Marked]]',mark:true}
        ],
        journal:[]},
      'that-page': {
        title: 'That Page',
        story: [{type:'paragraph',text:'Hello Word'}]
      }
    }
  }
  const probe = async (site,slug) => {
    // console.log('probe',{site,slug})
    return federation[site][slug]
  }
  const backlinks = slug => {
    // console.log('backlinks',slug)
    const pages = {
      'this-page': {
        'from-page': {'title': 'From Page','sites': []}
      }
    }
    return pages[slug]
  }

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

    describe('evalTree', async () => {
      const site = 'fed.wiki'
      const page = await probe(site,'this-page')
      var context = {
        probe,
        backlinks,
        name: page.title,
        site,
        page,
        graph:'digraph',
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
      it('can display links to nodes', async () => {
        const result = await graphviz.evalTree(['HERE NODE',['LINKS HERE -> NODE']],context,[])
        return expect(result[1]).to.be('"This\nPage" -> "That\nPage"');
      });
      it('can display linked nodes', async () => {
        const result = await graphviz.evalTree(['HERE',['LINKS',['HERE NODE']]],context,[])
        return expect(result[0]).to.be('"That\nPage"');
      });
      it('can display backlinks to nodes', async () => {
        const result = await graphviz.evalTree(['HERE NODE',['BACKLINKS NODE -> HERE']],context,[])
        return expect(result[1]).to.be('"From\nPage" -> "This\nPage"');
      });
      it('can display links from Graph plugins', async () => {
        const result = await graphviz.evalTree(['GRAPH'],context,[])
        return expect(result[1]).to.be('"World" -> "This\nPage"');
      });
      it('can selectively display one item', async () => {
        const result = await graphviz.evalTree(['HERE',['WHERE /^See also/',['LINKS HERE -> NODE']]],context,[])
        return expect(result[0]).to.be('"This\nPage" -> "Special\nPage"');
      });
      it('can selectively display one pagefold', async () => {
        const result = await graphviz.evalTree(['HERE',['WHERE FOLD wanted',['LINKS HERE -> NODE']]],context,[])
        return expect(result[0]).to.be('"This\nPage" -> "Want\nThis"');
      });
      it('can selectively display items with mark fields ', async () => {
        const result = await graphviz.evalTree(['HERE',['WHERE mark',['LINKS HERE -> NODE']]],context,[])
        return expect(result[0]).to.be('"This\nPage" -> "Want\nMarked"');
      });
    });
  });
}).call(this);
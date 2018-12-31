(function() {
  var bind, emit, expand;

  // http://viz-js.com/
  // https://github.com/fedwiki/wiki/issues/63

  expand = text => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&Lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<i>$1</i>');
  };

  emit = ($item, item) => {
    return $item.append(`<div data-item="viewer" style="background-color:#eee;padding:15px;"></div>`)
  };

  bind = function($item, item) {
    let el = $item.get(0)
    el.viz = new Promise((resolve, reject) => {
      let limit = 5
      function retry() {
        setTimeout(() => {
          try {
            let viz = new Viz()
            resolve(viz)
          } catch(err) {
            if (limit-- > 0)
              retry()
            else
              reject(err)
          }
        }, 500)
      }
      retry()
    })
    let insert = svg => {
      $item
        .find('div[data-item=viewer]')
        .html(svg)
        .find('svg').css({width: '100%', height: 'auto'})
    }
    el.viz
      .then(viz => viz.renderSVGElement(item.text, {engine: 'dot'}))
      .then(insert)
      .catch(err => {
        insert(`
        <p style="color: red;"><em>Something went wrong</em></p>
        <p>${err}</p>`)
      })

    return $item.dblclick(() => {
      return wiki.textEditor($item, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.graphviz = {emit, bind};
    if (typeof Viz === "undefined") {
      $('head').append(`
        <script src="//dobbs-wiki-plugins.hashbase.io/plugins/graphviz/client/viz.js"></script>
        <script src="//dobbs-wiki-plugins.hashbase.io/plugins/graphviz/client/full.render.js"></script>`)
    }
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand};
  }

}).call(this);

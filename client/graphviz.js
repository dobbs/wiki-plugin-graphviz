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
    return $item.append(`
    <div data-item="viewer" style="background-color:#eee;padding:15px;">
    <graphviz-viewer>${item.text}</graphviz-viewer>
    </div>`)
  };

  bind = function($item, item) {
    $item.dblclick(() => {
      return wiki.textEditor($item, item);
    });
    let viewer = $item.find('graphviz-viewer')
    viewer.dblclick(event => {
      event.stopPropagation()
      wiki.dialog('Graphviz', `<div><graphviz-viewer>${item.text}</graphviz-viewer></div>`)
    })
    setTimeout(()=>{
      $(viewer.get(0).shadowRoot).find('.node').click((event)=> {
        event.stopPropagation()
        event.preventDefault()
        let node = event.target.innerHTML
        console.log('click',node)
        let page = event.shiftKey ? null : $item.parents('.page')
        wiki.doInternalLink(node, page)
      })
    }, 3000)
  };

  if (typeof wiki !== "undefined" && typeof wiki.getModule === "undefined") {
    wiki.getModule = _.memoize((url) => {
      let script = document.createElement('script')
      script.type = 'module'
      script.src = url
      script.onerror = err => {
        throw new URIError(`script ${url} failed to load. ${err}`)
      }
      document.head.appendChild(script)
    })
  }

  if (typeof window !== "undefined" && window !== null) {
    wiki.getModule('/plugins/graphviz/graphviz-viewer.js')
    window.plugins.graphviz = {emit, bind};
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand};
  }

}).call(this);

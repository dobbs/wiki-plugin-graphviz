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
    return $item.dblclick(() => {
      return wiki.textEditor($item, item);
    });
  };

  if (typeof wiki.getModule === "undefined") {
    wiki.getModule = _.memoize(async (url) => {
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

(function() {
  var bind, emit, expand, moduleLoaded;

  // http://viz-js.com/
  // https://github.com/fedwiki/wiki/issues/63

  expand = text => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<i>$1</i>');
  };

  function makedot($item, item) {
    let text = item.text
    if (text.match(/^DOT MEHAFFY$/)) {
      return diagram ($item, item)
    } else if (text.match(/^DOT /)) {
      var root = tree(text.split(/\r?\n/), [], 0)
      var dot = `digraph {${eval(root,['ROOT']).join("\n")}}`
      // console.log('dot',dot)
      return dot
    } else {
      return text
    }

    function tree(lines, here, indent) {
      while (lines.length) {
        let m = lines[0].match(/( *)(.*)/)
        let spaces = m[1].length
        let command = m[2]
        if (spaces == indent) {
          here.push(command)
          console.log(indent, command)
          lines.shift()
        } else if (spaces > indent) {
          var more = []
          here.push(more)
          tree(lines, more, spaces)
        } else {
          return here
        }
      }
      return here
    }

    function quote (string) {
      return `"${string.replace(/ +/g,'\n')}"`
    }

    function eval(tree, dot) {
      let parent = dot[dot.length-1]
      tree.map ((e) => {
        if (Array.isArray(e)) {
          eval(e, dot)
        } else if (e.match(/^[A-Z]/)) {
          dot.push(`${parent} -> ${quote(e)}`)
          dot.push(quote(e))
        } else {
          dot.push(e)
        }
      })
      return dot
    }
  }

  async function diagram ($item, item) {
    let $page = $item.parents('.page')
    let site = $page.data('site')||location.host
    let slug = $page.attr('id')

    const get = (url) => fetch(url).then(res => res.json())
    const quote = (string) => `"${string.replace(/ +/g,'\n')}"`
    const asSlug = (name) => name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()
    const node = (title,color) => `${quote(title)} [fillcolor=${sites[asSlug(title)]?color:'lightgray'}]`
    var sites = {}, sitemap = await get(`http://${site}/system/sitemap.json`)
    sitemap.map (each => sites[each.slug] = each)

    var dot = ['node [shape=box style=filled fillcolor=lightgray]','rankdir=LR']
    var page = await get(`http://${site}/${slug}.json`)
    const links = /\[\[(.+?)\]\]/g
    while(more = links.exec(page.story[1].text)) {
      let title = more[1]
      console.log('title',title)
      dot.push(node(title,'bisque'))
      if(sites[asSlug(title)]) {
        let page2 = await get(`http://growing.bay.wiki.org/${asSlug(title)}.json`)
        for (var i = 0; i<page2.story.length; i++) {
          let text2 = page2.story[i].text
          const links2 = /\[\[(.+?)\]\]/g
          if (text2.match(/^When /)) {
            while(more2 = links2.exec(text2)) {
              console.log('when',more2[1])
              dot.push(node(more2[1],'lightblue'))
              dot.push(`${quote(more2[1])} -> ${quote(title)}`)
            }
          }
          if (text2.match(/^Then /)) {
            while(more2 = links2.exec(text2)) {
              console.log('then',more2[1])
              dot.push(node(more2[1],'lightblue'))
              dot.push(`${quote(title)} -> ${quote(more2[1])}`)
            }
          }
        }
      } else {
        dot.push(`${quote('pre-'+title+'-one')} -> ${quote(title)}`)
        dot.push(`${quote(title)} -> ${quote('post-'+title+'-one')}`)
        dot.push(`${quote('pre-'+title+'-two')} -> ${quote(title)}`)
        dot.push(`${quote(title)} -> ${quote('post-'+title+'-two')}`)
      }
    }
    return `strict digraph {\n${dot.join("\n")}\n}`
  }


  emit = ($item, item) => {
    return $item.append(`
    <div class="viewer" data-item="viewer" style="width:98%">
    </div>`)
  };

  bind = async function($item, item) {
    await moduleLoaded
    $item.dblclick(() => {
      return wiki.textEditor($item, item);
    });
    let dot = await makedot($item, item)
    $item.find('.viewer').html(`<graphviz-viewer>${dot}</graphviz-viewer>`)
    let $viewer = $item.find('graphviz-viewer')
    // $viewer.dblclick(event => {
    //   if(event.shiftKey) {
    //     event.stopPropagation()
    //     wiki.dialog('Graphviz', `<div><graphviz-viewer>${expand(item.text)}</graphviz-viewer></div>`)
    //   }
    // })
    $viewer.get(0).render().then(svg => {
      $(svg).find('.node').click((event)=> {
        event.stopPropagation()
        event.preventDefault()
        let node = $(event.target).parents('.node').find('title').text().replace(/\\n/g,' ')
        console.log('click',node)
        let page = event.shiftKey ? null : $item.parents('.page')
        wiki.doInternalLink(node, page)
      })
    })
  };

  if (typeof wiki !== "undefined" && typeof wiki.getModule === "undefined") {
    wiki.getModule = _.memoize((url) => new Promise((resolve, reject) => {
      let script = document.createElement('script')
      script.type = 'module'
      script.src = url
      script.onload = resolve
      script.onerror = err => reject(new URIError(`script ${url} failed to load. ${err}`))
      document.head.appendChild(script)
    }))
  }

  if (typeof window !== "undefined" && window !== null) {
    moduleLoaded = wiki.getModule('/plugins/graphviz/graphviz-viewer.js')
    window.plugins.graphviz = {emit, bind};
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand};
  }

}).call(this);

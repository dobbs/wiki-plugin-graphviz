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

  async function makedot($item, item) {
    const asSlug = (name) => name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()

    let text = item.text
    if (text.match(/^DOT MEHAFFY$/)) {
      return diagram ($item, item)
    } else if (text.match(/^DOT /)) {
      var root = tree(text.split(/\r?\n/), [], 0)
      var $page = $item.parents('.page')
      var here = $page.data('data')
      var context = {
        graph: 'digraph',
        name: here.title,
        site: $page.data('site')||location.host,
        page: here,
        want: here.story.slice()
      }
      var dot = await eval(root, context, [])
      return `${context.graph} {${dot.join("\n")}}`
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
          console.log('parse',command)
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

    async function get (context) {
      if (context.name == context.page.title) {
        return context.page
      } else {
        let slug = asSlug(context.name)
        const res = await fetch(`//${context.site}/${slug}.json`)
        return res.ok ? res.json() : null
      }
    }

    async function eval(tree, context, dot) {
      let deeper = []
      var pc = 0
      while (pc < tree.length) {
        let ir = tree[pc++]
        const nest = () => (pc < tree.length && Array.isArray(tree[pc])) ? tree[pc++] : []
        const peek = (keyword) => pc < tree.length && tree[pc]==keyword && pc++

        if (Array.isArray(ir)) {
          deeper.push({tree:ir, context})

        } else if (ir.match(/^[A-Z]/)) {
          console.log('eval',ir)

          if (ir.match(/^DOT (strict )?digraph/)) {
            context.graph = ir.replace(/DOT /,'')
          }

          if (ir.match(/^LINKS/)) {
            let text = context.want.map(p=>p.text).join("\n")
            let links = (text.match(/\[\[.*?\]\]/g)||[]).map(l => l.slice(2,-2))
            let tree = nest()
            links.map((link) => {
              if (ir.match(/^LINKS HERE -> NODE/)) {
                dot.push(`${quote(context.name)} -> ${quote(link)}`)
              }
              if (ir.match(/^LINKS NODE -> HERE/)) {
                dot.push(`${quote(link)} -> ${quote(context.name)}`)
              }
              deeper.push({tree, context:Object.assign({},context,{name:link})})
            })
          }

          if (ir.match(/^HERE/)) {
            let tree = nest()
            let page = await get(context)
            if (page) {
              if (ir.match(/^HERE NODE/)) {
                dot.push(quote(context.name))
              }
              if (ir.match(/^HERE NODE \w+/)) {
                dot.push(`${quote(ir)} -> ${quote(context.name)} [style=dotted]`)
              }
              deeper.push({tree, context:Object.assign({},context,{page, want:page.story})})
            }
            if (peek('ELSE')) {
              let tree = nest()
              if (!page) {
                deeper.push({tree, context})
              }
            }
          }

          if (ir.match(/^WHERE/)) {
            let tree = nest()
            var want = context.want
            if (m = ir.match(/\/.*?\//)) {
              let regex = new RegExp(m[0].slice(1,-1))
              want = want.filter(item => (item.text||'').match(regex))
            } else if (m = ir.match(/[a-z_]+/)) {
              let attr = m[0]
              debugger
              want = want.filter(item => item[attr])
              console.log('want',want)
            }
            deeper.push({tree, context:Object.assign({},context,{want})})
          }

          if (ir.match(/^FAKE/)) {
            if (ir.match(/^FAKE HERE -> NODE/)) {
              dot.push(`${quote(context.name)} -> ${quote('post-'+context.name)}`)
            }
            if (ir.match(/^FAKE NODE -> HERE/)) {
              dot.push(`${quote('pre-'+context.name)} -> ${quote(context.name)}`)
            }
          }

          if (ir.match(/^LINEUP/)) {
            let tree = nest()
            let $page = $item.parents('.page')
            let $lineup = $(`.page:lt(${$('.page').index($page)})`)
            $lineup.each((i,p) => {
              let site = $(p).data('site')||location.host
              let name = $(p).data('data').title
              deeper.push({tree, context:Object.assign({},context,{site, name})})
            })
          }

        } else {
          console.log('eval',ir.toString())
          dot.push(ir)
        }
      }

      for (var i=0; i<deeper.length; i++) {
        let child = deeper[i]
        await eval(child.tree, child.context, dot)
      }

      return dot
    }
  }

  async function diagram ($item, item) {
    let $page = $item.parents('.page')
    let site = $page.data('site')||location.host
    let slug = $page.attr('id')

    const get = (url) => fetch(url).then(res => res.json())
    const quote = (string) => `"${string.replace(/ +/g,'\n')}"`
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
      <div style="width:80%; padding:8px; color:gray; background-color:#eee; margin:0 auto; text-align:center">
        <i>loading diagram</i>
      </div>
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

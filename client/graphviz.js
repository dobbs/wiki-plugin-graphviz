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
    var text = item.text
    if (m = text.match(/^DOT FROM ([a-z0-9-]+)($|\n)/)) {
      let site = $item.parents('.page').data('site')||location.host
      let slug = m[1]
      var page = null
      try {
        page = await wiki.site(site).get(`${slug}.json`, (err, page) => page)
      } catch (err) {console.error('failed redirect', site, slug, err)}
      if (page) {
        redirect = page.story.find(each => each.type == 'graphviz')
        if (redirect) {
          console.log('redirect',site, slug, redirect)
          text = redirect.text
        }
      }
      if (text == item.text) {
        return trouble("can't do", item.text)
      }
    }
    if (m = text.match(/^DOT ((strict )?(di)?graph)\n/)) {
      var root = tree(text.split(/\r?\n/), [], 0)
      console.log('root',root)
      root.shift()
      var $page = $item.parents('.page')
      var here = $page.data('data')
      var context = {
        graph: m[1],
        name: here.title,
        site: $page.data('site')||location.host,
        page: here,
        want: here.story.slice()
      }
      var dot = await eval(root, context, [])
      console.log('dot', dot)
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

    function trouble (text, detail) {
      // console.log(text,detail)
      throw new Error(text + "\n" + detail)
    }

    async function probe (site,slug) {
      try {
        return wiki.site(context.site).get(`${slug}.json`, (err, page) => page)
      } catch (err) {
        return null
      }
    }

    async function get (context) {
      if (context.name == context.page.title) {
        return context.page
      } else {
        let slug = asSlug(context.name)
        var sites = context.page.journal.filter(action=>action.site).map(action=>action.site)
        sites.reverse()
        sites.unshift(context.site)
        sites.unshift(location.host)
        sites = sites.filter((site,pos)=>sites.indexOf(site)==pos)
        console.log('get', slug, sites)
        for (let site of sites) {
          let page = await probe(site,slug)
          console.log('probe',site,slug,page)
          if (page) return page
        }
        return null
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

          if (ir.match(/^LINKS/)) {
            let text = context.want.map(p=>p.text).join("\n")
            let links = (text.match(/\[\[.*?\]\]/g)||[]).map(l => l.slice(2,-2))
            let tree = nest()
            links.map((link) => {
              if (m = ir.match(/^LINKS HERE (->|--) NODE/)) {
                dot.push(`${quote(context.name)} ${m[1]} ${quote(link)}`)
              } else
              if (m = ir.match(/^LINKS NODE (->|--) HERE/)) {
                dot.push(`${quote(link)} ${m[1]} ${quote(context.name)}`)
              } else
              if (!ir.match(/^LINKS$/)) {
                trouble("can't do link", ir)
              }
              if (tree.length) {
                let new_context = Object.assign({},context,{name:link})
                new_context.promise = get(new_context)
                deeper.push({tree, context:new_context})
            }
            })
          } else

          if (ir.match(/^HERE/)) {
            let tree = nest()
            var page = null
            try {
              if(context.promise) {
                page = await context.promise
                delete context.promise
              } else {
                page = await get(context)
              }
            } catch (err) {}
            if (page) {
              if (ir.match(/^HERE NODE$/)) {
                dot.push(quote(context.name))
              } else
              if (ir.match(/^HERE NODE \w+/)) {
                let kind = context.graph.match(/digraph/) ? '->' : '--'
                dot.push(`${quote(ir)} ${kind} ${quote(context.name)} [style=dotted]`)
              } else
              if (!ir.match(/^HERE$/)) {
                trouble("can't do here", ir)
              }
              deeper.push({tree, context:Object.assign({},context,{page, want:page.story})})
            }
            if (peek('ELSE')) {
              let tree = nest()
              if (!page) {
                deeper.push({tree, context})
              }
            }
          } else

          if (ir.match(/^WHERE/)) {
            let tree = nest()
            var want = context.want
            if (m = ir.match(/\/.*?\//)) {
              let regex = new RegExp(m[0].slice(1,-1))
              want = want.filter(item => (item.text||'').match(regex))
            } else if (m = ir.match(/ FOLD ([a-z_-]+)/)) {
              var within = false
              want = want.filter((item) => {
                if (item.type == 'pagefold') {
                  within = item.text == m[1]
                }
                return within
              })
            } else if (m = ir.match(/[a-z_]+/)) {
              let attr = m[0]
              want = want.filter(item => item[attr])
            } else trouble("can't do where", ir)
            deeper.push({tree, context:Object.assign({},context,{want})})
          } else

          if (ir.match(/^FAKE/)) {
            if (m = ir.match(/^FAKE HERE (->|--) NODE/)) {
              dot.push(`${quote(context.name)} ${m[1]} ${quote('post-'+context.name)}`)
            } else
            if (m = ir.match(/^FAKE NODE (->|--) HERE/)) {
              dot.push(`${quote('pre-'+context.name)} ${m[1]} ${quote(context.name)}`)
            } else trouble("can't do fake", ir)
          } else

          if (ir.match(/^LINEUP$/)) {
            let tree = nest()
            try {
              let $page = $item.parents('.page')
              let $lineup = $(`.page:lt(${$('.page').index($page)})`)
              $lineup.each((i,p) => {
                let site = $(p).data('site')||location.host
                let name = $(p).data('data').title
                deeper.push({tree, context:Object.assign({},context,{site, name})})
              })
            } catch {
              throw new Error("can't do LINEUP yet")
            }
          } else trouble("can't do", ir)

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

  function message (text) {
    return `
    <div class="viewer" data-item="viewer" style="width:98%">
      <div style="width:80%; padding:8px; color:gray; background-color:#eee; margin:0 auto; text-align:center">
        <i>${text}</i>
      </div>
    </div>`
  }


  emit = ($item, item) => {
    return $item.append(message('loading diagram'))
  };

  bind = async function($item, item) {
    await moduleLoaded
    $item.dblclick(() => {
      return wiki.textEditor($item, item);
    });

    function download(filename, text) {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }

    $item.click((e) => {
      if(!e.shiftKey) return
      e.stopPropagation()
      e.preventDefault()
      let slug = $item.parents('.page').attr('id')
      let svg = $item.find('graphviz-viewer').get(0).shadowRoot.querySelector('svg').outerHTML
      download(`${slug}.svg`, svg)
    })

    try {
      let dot = await makedot($item, item)
      $item.find('.viewer').html(`<graphviz-viewer>${dot}</graphviz-viewer>`)
      let $viewer = $item.find('graphviz-viewer')
      $viewer.dblclick(event => {
        if(event.shiftKey) {
          event.stopPropagation()
          let svg = $item.find('graphviz-viewer').get(0)
              .shadowRoot.querySelector('svg').cloneNode(true)
          wiki.dialog('Graphviz', svg)
        }
      })
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
    } catch (err) {
      console.log('makedot',err)
      $item.html(message(err.message))
    }
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

"use strict"

import Viz from './viz.js/viz.es.js'

class GraphvizViewer extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
  }

  connectedCallback() {
    if (super.connectedCallback)
      super.connectedCallback()

    const workerURL = new URL('./viz.js/full.render.js', import.meta.url)
    const viz = new Viz({ workerURL });

    const tag = this
    viz.renderSVGElement(this.decodedHTML())
      .then(function(svg) {
        svg.setAttribute('style', 'width: 100%; height: auto;')
        tag.shadowRoot.appendChild(svg)
      })
      .catch(err => {
        console.log({err})
        tag.shadowRoot.innerHTML = `
        <div style="background-color: red;"><p>Something went wrong</p><pre>${err}</pre></div>`
      })
  }

  // see https://stackoverflow.com/a/34064434/1074208
  decodedHTML() {
    return new DOMParser()
      .parseFromString(this.innerHTML, 'text/html')
      .documentElement
      .textContent
  }
}

customElements.define('graphviz-viewer', GraphvizViewer)
export default GraphvizViewer

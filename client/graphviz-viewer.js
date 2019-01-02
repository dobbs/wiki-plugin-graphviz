"use strict"

import Viz from './viz.js/viz.es.js'

class GraphvizViewer extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    this.workerURL = new URL('./viz.js/full.render.js', import.meta.url)
  }

  render() {
    const self = this
    if (!this.alreadyRendered) {
      this.alreadyRendered = new Promise((resolve, reject) => {
        self.viz = new Viz({ workerURL: self.workerURL })
        return self.viz.renderSVGElement(self.decodedHTML())
          .then(svg => {
            svg.setAttribute('style', 'width: 100%; height: auto;')
            self.shadowRoot.appendChild(svg)
            return svg
          })
          .then(resolve)
      })
    }
    return this.alreadyRendered
  }

  connectedCallback() {
    const self = this
    if (super.connectedCallback)
      super.connectedCallback()
    this.render().catch(err => {
      console.log({err})
      self.shadowRoot.innerHTML = `
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

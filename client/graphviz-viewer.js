"use strict"

import {graphviz} from './wasm/index.es6.js';

const wasmFolder = "/plugins/graphviz/wasm"

const template = document.createElement('template')
template.innerHTML = `
    <div style="width:80%; padding:8px; color:gray; background-color:#eee; margin:0 auto; text-align:center">
      <i id="message"></i>
    </div>`

function message (text) {
  let div = template.content.cloneNode(true)
  div.querySelector('#message').appendChild(document.createTextNode(text))
  return div
}

class GraphvizViewer extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.message('drawing diagram');
  }

  message(text) {
    this.shadowRoot.querySelector('#message').innerHTML = text;
  }

  render() {
    const self = this
    if (!this.alreadyRendered) {
      this.alreadyRendered = new Promise((resolve, reject) => {
        const dot = self.decodedHTML()
        graphviz.layout(dot, "svg", "dot", {
          wasmFolder: wasmFolder
        })
        .then(svgString => {
          const parser = new DOMParser()
          const svg = parser.parseFromString(svgString, 'image/svg+xml').documentElement
          svg.setAttribute('style', 'width: 100%; height: auto;')
          //self._clearShadowRoot()
          //self.shadowRoot.innerHTML = svg
          self._replaceShadowRoot(svg)
          return svg
        })
        .then(resolve)
        .catch(err => {console.log('render',err); self._replaceShadowRoot(message(err.message))})
      })
    }
    return this.alreadyRendered
  }

  async connectedCallback() {
    const self = this
    if (super.connectedCallback)
      super.connectedCallback()
    this.render().catch(err => {
      console.log({err})
      self._replaceShadowRoot(message(err.message))
    })
  }

  // see https://stackoverflow.com/a/34064434/1074208
  decodedHTML() {
    return new DOMParser()
      .parseFromString(this.innerHTML, 'text/html')
      .documentElement
      .textContent
  }

  _replaceShadowRoot(el) {
    // remove all child elements: https://stackoverflow.com/a/3955238/1074208
    while(this.shadowRoot.firstChild)
      this.shadowRoot.removeChild(this.shadowRoot.firstChild)
    this.shadowRoot.appendChild(el)
  }
}

customElements.define('graphviz-viewer', GraphvizViewer)
export default GraphvizViewer

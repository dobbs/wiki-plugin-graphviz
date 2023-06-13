"use strict"

import {Graphviz} from './hpcc/graphviz.js'
const graphviz = await Graphviz.load()

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
    this._svg = '';
  }

  get dot() {
    // see https://stackoverflow.com/a/34064434/1074208
    return new DOMParser()
      .parseFromString(this.innerHTML, 'text/html')
      .documentElement
      .textContent;
  }
  get svg() {return this._svg;}

  message(text) {
    this.shadowRoot.querySelector('#message').innerHTML = text;
  }

  render() {
    this._svg = graphviz.dot(this.dot)
    const parser = new DOMParser();
    const svg = parser.parseFromString(this._svg, 'image/svg+xml').documentElement
    svg.setAttribute('style', 'width: 100%; height: auto;');
    this._replaceShadowRoot(svg);
    return Promise.resolve(svg)
  }

  async connectedCallback() {
    if (super.connectedCallback)
      super.connectedCallback()
    await this.render()
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

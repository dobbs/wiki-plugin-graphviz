import * as esbuild from 'esbuild'
import packageJSON from '../package.json' with { type: "json"}

const version = packageJSON.version
const now = new Date()

await esbuild.build({
  entryPoints: ['src/graphviz-viewer.js'],
  bundle: true,
  banner: {
    js: `/* wiki-plugin-graphviz - ${version} - ${now.toUTCString()} */`
  },
  minify: true,
  sourcemap: true,
  logLevel: 'info',
  format: 'esm',
  outfile: 'client/graphviz-viewer.js'
})

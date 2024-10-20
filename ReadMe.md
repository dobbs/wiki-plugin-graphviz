# Federated Wiki - Graphviz Plugin

This plugin, type: graphviz, extends the markup of the federated wiki.

## Development workflow

    # build the plugin into an NPM package
    npm version prerelease --preid=wip --force --no-git-tag-version
    PKG=$(npm pack | tail -1)
    mv $PKG ../wiki

    # install the plugin into a local copy of wiki
    cd ../wiki
    npm install $PKG

    # run wiki
    node index.js --data ./data --security_legacy

    # visit http://localhost:3000 to test the plugin revisions

## Test development workflow

    # install github code spaces utilities
    npm i -g c8
    npm i -g http-server

    # run tests with coverage details
    c8 -r 'lcov' npx mocha
    (cd coverage/lcov-report/; http-server)

## Release workflow

    npm version patch
    TAG="v$(jq -r .version package.json)"
    git push --atomic origin main "$TAG"
    npm publish

## License

MIT

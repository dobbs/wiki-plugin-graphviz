# Federated Wiki - Graphviz Plugin

This plugin, type: graphviz, extends the markup of the federated wiki.

## Development workflow

    # context for the filesystem
    WIKIDIR=$HOME/workspace/wiki
    PLUGDIR=$HOME/workspace/wiki-plugin-graphviz

    # clean up the previous mess
    #   (This cleanup is distructive. Proceed with awareness.)
    cd $WIKIDIR
    git reset --hard       # throws away local changes
    rm -rf node_modules    # throws away local libraries
    npm install            # reinstalls the declared libraries

    # build the plugin into an NPM package
    cd $PLUGDIR
    npm version prerelease --preid=wip --force --no-git-tag-version
    PKG=$(npm pack -1)
    mv $PKG $WIKIDIR

    # install the plugin into a local copy of wiki
    cd $WIKIDIR
    npm install $PKG

    # run wiki
    node index.js --data ./data --security_legacy

    # visit http://localhost:3000 to test the plugin revisions

## Release workflow

    npm version patch
    TAG="v$(jq -r .version package.json)"
    git push --atomic origin main "$TAG"
    npm publish

## License

MIT

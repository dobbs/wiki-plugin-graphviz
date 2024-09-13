const gitAuthors = require('grunt-git-authors')

gitAuthors.updateAuthors({}, (error, filename) => {
  if (error) {
    console.log('Error: ', error)
  } else {
    console.log(filename, 'updated')
  }
})

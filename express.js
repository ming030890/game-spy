const express = require('express')
const app = express()

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html','css','js','ico','jpg','jpeg','png','svg'],
  index: ['index.html'],
  maxAge: '1000',
  redirect: false
}
app.use(express.static('public', options))

module.exports = app
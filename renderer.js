
const snoowrap = require('snoowrap');
const webview = document.getElementById("web")

/*
webview.addEventListener('dom-ready', () => {
  webview.getWebContents().session.setProxy({
    pacScript: 'file:///home/wangbin/proxy.pac'
  }, () => {})
})
*/

var r = null
var posts = []

var v = new Vue({
  el: '#main',
  data: {
    posts: [],
    hidePost: true,
    comments: [],
    selected_index: -1
  },
  methods: {
    openPost: function (index) {
      this.comments = []
      if (this.selected_index == index) {
        this.hidePost = true
        this.selected_index = -1
        return
      }
      this.hidePost = false
      webview.loadURL('view://loading.html')
      webview.loadURL(this.posts[index].url)
      this.selected_index = index
      const self = this
      posts[index].expand_replies({limit: 30, depth: 1}).then(comments => {
        return comments.comments.map(comment => {
            return {
              body_html: comment.body_html,
              author: {name: comment.author.name},
              ups: comment.ups
            }
        })
      }).then(comments => {self.comments = comments})
    },
    upvote: function (index) {
      if (this.posts[index].likes) {
        posts[index].unvote()
        this.posts[index].likes = null
      } else {
        posts[index].upvote()
        this.posts[index].likes = true
      }
    }
  }
})


function renderList(r) {
  r.get_hot({limit: 20}).then(p => posts = p).map(post => {
    return {
      title: post.title,
      url: post.url,
      author: {name: post.author.name},
      subreddit: {display_name: post.subreddit.display_name},
      created_utc: post.created_utc,
      num_comments: post.num_comments,
      score: post.score,
      likes: post.likes
    }
  }).then(posts => v.$set('posts', posts))
}

const {ipcRenderer} = require('electron')
ipcRenderer.on('reddit-token', (event, token) => {
  console.log(token)

  r = new snoowrap({
    'user_agent': 'Reddit Desktop',
    'access_token': token
  })
  r.get_me().then(console.log)

  renderList(r)
})

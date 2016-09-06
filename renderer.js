
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
var commentCols = []

var v = new Vue({
  el: '#main',
  data: {
    posts: [],
    hidePost: true,
		commentCols: [],
    postSelectIdx: -1,
    commentSelectIdx: [],
  },
  computed: {
    mainStyle: function () {
      const width = Math.max(67 + this.commentCols.length * 33, 100)
      return {
        'width': `${width}%`,
        'margin-left': `${100-width}%`
      }
    },
  },
  methods: {
    appendComments: function (comments) {
      commentCols.push(comments)
      const renderedComments = comments.map(comment => {
          return {
            body_html: comment.body_html,
            author: {name: comment.author.name},
            ups: comment.ups
          }
      })
      this.commentCols.push(renderedComments)
    },
    openPost: function (index) {
      this.commentCols = []
      commentCols = []
      this.commentSelectIdx = []
      if (index == this.postSelectIdx) {
        this.hidePost = true
        this.commentCols = []
        this.postSelectIdx = -1
        return
      }
      this.hidePost = false
      webview.loadURL('view://loading.html')
      webview.loadURL(this.posts[index].url)
      posts[index].expand_replies({limit: 20, depth: 1}).then(x => this.appendComments(x.comments))
      this.postSelectIdx = index
    },
    loadMorePost: function () {
      posts.fetch_more({amount: 20}).then(p => posts = p).map(renderPost).then(posts => this.posts = posts)
    },
    openComment: function (col, index) {
      this.commentCols = this.commentCols.slice(0, col+1)
      commentCols = commentCols.slice(0, col+1)
      this.commentSelectIdx = this.commentSelectIdx.slice(0, col+1)
      if (index == this.commentSelectIdx[col]) {
        this.commentCols[col][index].selected = false
        this.commentSelectIdx[col] = -1
      } else {
        this.appendComments(commentCols[col][index].replies)
        this.commentSelectIdx[col] = index
      }
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


function renderPost(post) {
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
}

function renderList(r) {
  r.get_hot({limit: 20}).then(p => posts = p).map(renderPost).then(posts => v.$set('posts', posts))
}

const {ipcRenderer} = require('electron')
ipcRenderer.on('reddit-token', (event, token) => {
  console.log(token)

  r = new snoowrap({
    'user_agent': 'Reddit Desktop',
    'client_id': 'YKa6s8nWTInbhQ',
    'client_secret': '',
    'refresh_token': token
  })
  r.get_me().then(console.log)

  renderList(r)
})

module.exports.commentCols = commentCols
module.exports.posts = posts
module.exports.v = v
module.exports.r = r

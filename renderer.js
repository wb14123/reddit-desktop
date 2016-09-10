
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
    commentText: []
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
            ups: comment.ups,
            likes: comment.likes,
            saved: comment.saved,
            created_utc: comment.created_utc
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
    op: function(obj, renderObj, doFunc, undoFunc, state, onValue) {
      if (renderObj[state] === onValue) {
        obj[undoFunc]()
        renderObj[state] = null
      } else {
        obj[doFunc]()
        renderObj[state] = onValue
      }
    },
    upvotePost: function (index) {
      this.op(posts[index], this.posts[index], 'upvote', 'unvote', 'likes', true)
    },
    upvoteComment: function (col, index) {
      this.op(commentCols[col][index], this.commentCols[col][index],
        'upvote', 'unvote', 'likes', true)
    },
    downvotePost: function (index) {
      this.op(posts[index], this.posts[index], 'downvote', 'unvote', 'likes', false)
    },
    downvoteComment: function (col, index) {
      this.op(commentCols[col][index], this.commentCols[col][index],
        'downvote', 'unvote', 'likes', false)
    },
    savePost: function (index) {
      this.op(posts[index], this.posts[index], 'save', 'unsave', 'saved', true)
    },
    saveComment: function (col, index) {
      this.op(commentCols[col][index], this.commentCols[col][index],
        'save', 'unsave', 'saved', true)
    },
    postComment: function (col) {
      var post = null
      if (col == 0) {
        post = posts[this.postSelectIdx]
      } else {
        post = commentCols[col-1][this.commentSelectIdx[col-1]]
      }
      post.reply(this.commentText[col]).then(reply => {
        this.commentText = []
        this.commentCols[col].push(reply)
      })
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
    likes: post.likes,
    saved: post.saved
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

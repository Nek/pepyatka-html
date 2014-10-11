define(["config",
        "app/app"], function(config, App) {
  App.Post = Ember.Object.extend({
    showAllComments: false,

    // TODO: this is overwritten in Timeline find method
    comments: Ember.ArrayProxy.extend({content: []}),

    partial: function() {
      if (this.showAllComments)
        return false
      else
        return this.get('comments.content.length') > 3
    }.property('showAllComments', 'comments'),

    postOwner: function() {
      return this.get('createdBy.id') === App.properties.userId &&
        this.get('createdBy.username') !== 'anonymous'
    }.property('createdBy'),

    currentUserLiked: function() {
      var liked = false;
      var likes = this.get('likes')

      // XXX: we have just tried to render a view but have not recevied
      // anything from the server yet. Ideally we have to wait for this
      if (!likes) return;

      // TODO: refactor to mapProperty
      likes.forEach(function(like) {
        if (like.id === App.properties.userId) {
          liked = true;
          return true;
        }
      })
      return liked;
    }.property('likes', 'likes.@each.id', 'App.properties.userId'),

    anyLikes: function() {
      var likes = this.get('likes')

      // XXX: we have just tried to render a view but have not recevied
      // anything from the server yet. Ideally we have to wait for this
      if (!likes) return;

      return likes.length > 0
    }.property('likes', 'likes.@each'),

    // TODO: this is a bound helper
    createdAgo: function() {
      if (this.get('createdAt')) {
        return moment(this.get('createdAt')).fromNow();
      }
    }.property('createdAt'),

    firstComment: function() {
      return this.get('comments.content')[0]
    }.property('comments.content'),

    lastComment: function() {
      var comments = this.get('comments.content')
      return comments[comments.length-1]
    }.property('comments.content', 'comments.@each'),

    skippedCommentsLength: function() {
      // display first and last comments only
      return this.get('comments.content').length - 2
    }.property('comments.content.@each'),
  });

  App.Post.reopenClass({
    resourceUrl: config.host + '/v1/posts',

    createFromProto: function(attrs) {
      var comments = attrs.comments
      delete attrs.comments

      var attachments = attrs.attachments
      delete attrs.attachments

      var post = App.Post.create(attrs)
      post.comments = Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
        // TODO: figure out why we have to add itemController="comment"
        // option to each iterator in the view
        itemController: 'comment',
        content: []
      })

      if (comments) {
        comments.forEach(function(attrs) {
          var comment = App.Comment.create(attrs)
          post.comments.addObject(comment)
        })
      }

      post.attachments = Ember.ArrayProxy.create({content: []});
      if (attachments) {
        attachments.forEach(function(attrs) {
          var attachment = App.Attachment.create(attrs)
          post.attachments.addObject(attachment)
        })
      }

      return post
    },

    update: function(postId, attrs) {
      $.ajax({
        url: this.resourceUrl + '/' + postId,
        dataType: 'jsonp',
        type: 'post',
        data: { body: attrs.body, '_method': 'patch', '_csrf': csrf_token },
        success: function(response) {
          console.log(response)
        }
      })
    },

    like: function(postId) {
      $.ajax({
        url: this.resourceUrl + '/' + postId + '/like',
        dataType: 'jsonp',
        type: 'post',
        data: { '_csrf': csrf_token },
        success: function(response) {
          console.log(response)
        }
      })
    },

    unlike: function(postId) {
      $.ajax({
        url: this.resourceUrl + '/' + postId + '/unlike',
        dataType: 'jsonp',
        type: 'post',
        data: { '_csrf': csrf_token },
        success: function(response) {
          console.log(response)
        }
      })
    },

    find: function(postId) {
      var post = App.Post.create();

      // XXX: use `createFromProto' maybe?
      $.ajax({
        url: this.resourceUrl + '/' + postId,
        dataType: 'jsonp',
        success: function(response) {
          post.set('comments', Ember.ArrayProxy.createWithMixins(Ember.SortableMixin, {
            // TODO: figure out why we have to add itemController="comment"
            // option to each iterator in the view
            itemController: 'comment',

            content: []
          }))

          if (response.comments) {
            response.comments.forEach(function(attrs) {
              var comment = App.Comment.create(attrs)
              post.comments.addObject(comment)
            })
          }

          delete response.comments

          post.set("attachments", Ember.ArrayProxy.create({content: []}))
          if (response.attachments) {
            response.attachments.forEach(function(attrs) {
              var attachment = App.Attachment.create(attrs)
              post.attachments.addObject(attachment)
            })
          }
          delete response.attachments

          post.setProperties(response);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          //if (errorThrown == 'Not Found')
          //  that.transitionToRoute('error')
        }
      })
      return post;
    },

    kill: function(postId) {
      $.ajax({
        url: this.resourceUrl + '/' + postId,
        dataType: 'jsonp',
        type: 'post',
        data: { '_method': 'delete', '_csrf': csrf_token },
        success: function(response) {
          console.log(response)
        }
      })
    },

    submit: function(attrs, options) {
      var that = this

      var xhr = new XMLHttpRequest();

      // Progress listerner.
      xhr.upload.addEventListener("progress", function (evt) {
        if (evt.lengthComputable) {
          options && options.progress && options.progress()
        } else {
          // unable to compute
        }
      }, false);

      // On finished.
      xhr.addEventListener("load", function (evt) {
        options && options.load && options.load()
      }, false);

      // On failed.
      xhr.addEventListener("error", function (evt) {
        options && options.error && options.error()
      }, false);

      // On cancel.
      xhr.addEventListener("abort", function (evt) {
        options && options.cancel && options.cancel()
      }, false);

      xhr.open("post", this.resourceUrl);
      xhr.send(attrs);
    }
  })
});

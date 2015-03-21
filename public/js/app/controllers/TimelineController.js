define(["config",
        "app/app"], function(config, App) {
  App.TimelineController = Ember.ObjectController.extend(App.PaginationHelper, {
    resourceUrl: config.host + '/v1/posts',

    isProgressBarHidden: 'hidden',

    visiblePosts: function() {
      var posts = this.get('posts')
      return posts.filter(function (post) { return !post.isHidden })
    }.property('posts.@each'),

    hiddenPosts: function() {
      var posts = this.get('posts')
      return posts.filter(function (post) { return post.isHidden })
    }.property('posts.@each'),

    hasHiddenPosts: function() {
      return this.get('hiddenPosts').length > 0
    }.property('hiddenPosts.@each'),

    hiddenPostsShown: false,

    actions: {
      subscribeTo: function() {
        var controller = this;

        App.Timeline.subscribeTo(this.get("id"), {
          success: function(response) {
            if (response.status == 'success') {
              controller.transitionToRoute('home');
            }
          }
        });
      },

      unsubscribeTo: function() {
        var controller = this;

        App.Timeline.unsubscribeTo(this.get("id"), {
          success: function(response) {
            if (response.status == 'success') {
              controller.transitionToRoute('home');
            }
          }
        });
      },

      submitPost: function(attrs) {
        var that = this

        var data = new FormData()
          timelineIds = []

        $.each($('input[type="file"]')[0].files, function(i, file) {
          // TODO: can do this just once outside of the loop
          // that.set('isProgressBarHidden', 'visible')
          data.append('file-'+i, file);
        });

        if (!attrs)
          return

        var view = attrs.get('_parentView._childViews').find(function(e) {
          if (e.viewName === 'sendTo')
            return e
        })
        if (view) {
          var timelinesIds = view.$("#sendToSelect").select2("val")
          for(var i = 0; i < timelinesIds.length; i++) {
            //data.append('timelinesIds', timelinesIds[i])
            timelineIds.push(timelinesIds[i])
          }
        } else if (this.get('content.name') !== 'River of news') {
          //data.append('timelinesIds', this.get('content.id'))
          timelineIds.push(this.get('content.id'))
        }

        data.append('body', attrs.value)

        callbacks = {
          progress: function() {
            //var percentComplete = Math.round(evt.loaded * 100 / evt.total);
            //that.set('progress', percentComplete)
          },

          load: function() {
            // Clear file field
            //var control = $('input[type="file"]')
            //control.replaceWith( control.val('').clone( true ) );
            //$('.file-input-name').html('')

            // var obj = $.parseJSON(evt.target.responseText);
            // TODO: bind properties
            //that.set('progress', '100')
            //that.set('isProgressBarHidden', 'hidden')
          },

          error: function() {
            //that.set('isProgressBarHidden', 'hidden')
          },

          cancel: function() {
            //that.set('isProgressBarHidden', 'hidden')
          }
        }

        //App.Post.submit(data, callbacks)
        attributes = { body: attrs.value, timelinesIds: timelineIds }
        App.Post.submit(attributes, callbacks)
      },

      'toggleShowHidden': function() {
        this.toggleProperty('hiddenPostsShown')
      }
    },

    didRequestRange: function(options) {
      this.set('content', App.Timeline.find(this.get('content.timelineId'),
                                            { offset: options.offset || 0 }))
    }
  })
});

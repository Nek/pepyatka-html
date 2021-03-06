define(["app/app",
        "ember",
        "components/CustomErrorRoute"], function(App, Ember) {
  "use strict";

  App.PostRoute = Ember.Route.extend(App.CustomErrorRoute, {
    deactivate: function() {
      this.controllerFor('pub-sub').unsubscribe()
    },

    model: function(params) {
      return this.store.findOneQuery('post', params.postId, { maxComments: 'all' })
    },

    setupController: function(controller, model) {
      this.controllerFor('pub-sub').set('channel', model)

      controller.set('model', model)
    }
  })
})

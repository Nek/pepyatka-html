define(["config",
        "app/app",
        "ember"], function(config, App, Ember) {
  App.SearchField = Ember.TextField.extend(Ember.TargetActionSupport, {
    valueBinding: 'view.body',

    insertNewline: function() {
      this.triggerAction();
    }
  })

  App.SearchButton = Ember.View.extend(Ember.TargetActionSupport, {
    layout: Ember.Handlebars.compile('{{t button.search}}'),

    tagName: 'button',

    click: function() {
      this.get('_parentView.textField').triggerAction()
    }
  })

  App.Properties = Ember.Object.extend({
    isAuthorized: function() {
      if (!this.username || this.username === 'anonymous')
        return false

      return true
    }.property(),

    username: null,
    userId: null,
    screenName: null,

    currentPath: null,

    setAuthToken: function() {
      var token = this.authToken
      if (token) {
        window.localStorage.setItem('token', token);

        $.ajaxSetup({
          url: config.host
        })

        $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
          options.data = $.param($.extend(originalOptions.data, { token: token }))
        });
      }
    }.observes('authToken')
  })
  App.properties = App.Properties.create()

  App.Helpers = Ember.Object.extend({
    handleAjaxError: function(r) {
      window.location.href = "/";
    }
  })
  App.helpers = App.Helpers.create()

  App.ShowSpinnerWhileRendering = Ember.Mixin.create({
    layout: Ember.Handlebars.compile('<div {{bind-attr class="isLoaded"}}>{{ yield }}</div>'),

    classNameBindings: ['isLoaded::loading'],

    isLoaded: function() {
      return !!this.get('isInserted') && !!this.get('controller.isLoaded')
    }.property('isInserted', 'controller.isLoaded'),

    didInsertElement: function() {
      this.set('isInserted', true);
      this._super();
    }
  });

  App.PaginationHelper = Ember.Mixin.create({
    pageSize: 25,
    pageStart: 0,

    nextPage: function() {
      this.incrementProperty('pageStart', this.get('pageSize'))
    },

    prevPage: function() {
      this.decrementProperty('pageStart', this.get('pageSize'))
    },

    prevPageDisabled: function() {
      return this.get('pageStart') === 0 ? 'disabled' : ''
    }.property('pageStart'),

    prevPageVisible: function() {
      return this.get('prevPageDisabled') !== 'disabled'
    }.property('prevPageDisabled'),

    nextPageVisible: function() {
      return this.get('nextPageDisabled') !== 'disabled'
    }.property('nextPageDisabled'),

    nextPageDisabled: function() {
      var len = this.get('content.posts.length') ||
        this.get('content.content.length')
      return len === 0 || len === undefined ||
        len < this.get('pageSize') ? 'disabled' : ''
    }.property('content.posts.length', 'content.content.length', 'pageSize'),

    resetPage: function() {
      this.set('pageStart', 0)
    },

    pageDidChange: function() {
      this.didRequestRange({ offset: this.get('pageStart'),
                             limit: this.get('pageSize') });
    }.observes('pageStart')
  });

  App.EditPostField = Ember.TextArea.extend(Ember.TargetActionSupport, {
    attributeBindings: ['class'],
    classNames: ['autogrow-short'],
    valueBinding: Ember.Binding.oneWay('controller.body'),
    viewName: 'textField',

    keyPress: function(event) {
      if (event.keyCode === 13) {
        this.triggerAction();

        this.set('_parentView._parentView._parentView.isEditFormVisible', false)
        // dirty way to restore original height of post textarea
        this.$().find('textarea').height('56px')

        return false;
      }
    },

    didInsertElement: function() {
      this.$().autogrow();
    }
  })

  App.CreatePostField = Ember.TextArea.extend(Ember.TargetActionSupport, {
    attributeBindings: ['class'],
    classNames: ['autogrow-short'],
    valueBinding: 'body',
    viewName: 'textField',

    click: function() {
      var view = this.get('parentView.sendTo')
      if (view)
        view.set('isVisible', true)
    },

    keyPress: function(event) {
      if (event.keyCode === 13) {
        this.triggerAction()

        this.set('body', '')

        // dirty way to restore original height of post textarea
        this.$().find('textarea').height('56px')

        return false
      }
    },

    didInsertElement: function() {
      this.$().autogrow();
    }
  })

  App.SubmitPostButton = Ember.View.extend(Ember.TargetActionSupport, {
    layout: Ember.Handlebars.compile('{{t button.post}}'),

    tagName: 'button',

    click: function() {
      var _view = this.get('_parentView.textField') ||
        this.get('_parentView._parentView.textField')

      _view.triggerAction()

      _view.set('body', '')
      this.set('_parentView._parentView._parentView.isEditFormVisible', false)
    }
  })

  App.UploadFileView = Ember.TextField.extend({
    type: 'file',
    classNames: ["add-file-button"],

    didInsertElement: function() {
      this.$().prettyInput()
    }
  })
});

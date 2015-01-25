(function(app) {
	
	/**
	 * Trims given path so that it follows this rule:
	 *   /path/like/that
	 */
	function trimPath(path) {
		if (path.indexOf("#") == 0) path = path.substr(1);
		path = ("/" + path + "/").replace(/(\/+)/g, "/");
		return path.substring(0, path.length - 1);
	}
	
	var emptyRoute = {
		when: function() {
			return this;
		}
	};
	
	var route = {
		
		hashBefore: "/",
		hashNow: trimPath(location.hash),
		
		open: function(path) {
			location.hash = trimPath(path);
		},
		
		back: function() {
			this.open(this.hashBefore);
		},
		
		listeners: [],
		
		/**
		 * Start listening route changes. On 
		 * change given function will be called.
		 *
		 * @param fn
		 * @param context (this)
		 */
		listen: function(fn, context) {
			this.listeners.push({
				fn: fn,
				context: context
			});
			this.notifyListeners();
		},
		
		notifyListeners: function() {
			for (var i = 0, l = this.listeners.length; i < l; ++i) {
				var listener = this.listeners[i];
				listener.fn.call(listener.context, this.hashBefore, this.hashNow);
			}
		},
		
		startListener__: function(fn, context) {
			var self = this;
			window.addEventListener("hashchange", function() {
				self.hashBefore = self.hashNow;
				self.hashNow = trimPath(location.hash);
				self.notifyListeners();
			}, false);
		},

		/**
		 * Usage:
		 * when("/path/{id}/lol", function(id) {
		 *   // do something with id if path match
		 * })
		 * .when("/other/path/", function() {
		 *   // or this could match too
		 *  })
		 *  .when(true, function() {
		 *    // default
		 *  });
		 */
		when: function(path, fn) {
			if (path == true) {
				fn.apply(this, null);
				return emptyRoute;
			}
			
			var vars = [];
			var givenPathParts = trimPath(path).substr(1).split("/");
			var givenPathPartsLen = givenPathParts.length;
			var pathParts = trimPath(location.hash).substr(1).split("/");
			var pathPartsLen = pathParts.length;
			
			for (var i = 0, l = givenPathParts.length; i < l; ++i) {
				var part = givenPathParts[i];
				// if given path part is {variable}
				if (part.charAt(0) == "{" && part.charAt(part.length - 1) == "}") {
					vars.push(pathParts[i]);
				}
				else if (part == "*") {	
				}
				else if (part == "**") {
					break;
				}
				// if given path part does not match real path part 
				else if (part != pathParts[i]) {
					return this;
				}
				// if there is more given path parts than real path parts
				else if (i >= pathPartsLen) {
					return this;
				}
			}
			
			if (pathPartsLen != givenPathPartsLen) {
				return this;
			}
			
			fn.apply(this, vars);
			return emptyRoute;
		}
	};
	route.startListener__();
	
	app.route = route;
	
})(window.TodAi);
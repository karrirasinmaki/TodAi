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
		open: function(path) {
			location.hash = trimPath(path);
		},
		
		/**
		 * Start listening route changes. On 
		 * change given function will be called.
		 *
		 * @param fn
		 * @param context (this)
		 */
		listen: function(fn, context) {
			window.addEventListener("hashchange", function() {
				fn.call(context);
			}, false);
			fn.call(context);
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
			var pathParts = trimPath(location.hash).substr(1).split("/");
			var pathPartsLen = pathParts.length;
			
			for (var i = 0, l = givenPathParts.length; i < l; ++i) {
				var part = givenPathParts[i];
				// if given path part is {variable}
				if (part.charAt(0) == "{" && part.charAt(part.length - 1) == "}") {
					vars.push(pathParts[i]);
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
			
			fn.apply(this, vars);
			return emptyRoute;
		}
	};
	
	app.route = route;
	
})(window.TodAi);
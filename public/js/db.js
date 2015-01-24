
/**
 * Database code here.
 *
 * Callback functions take two parameters, 
 * error and reponse. As so:
 *   function(err, resp) {
 *     if (err) {
 *       // on error
 *     }
 *     else {
 *       // on success
 *     }
 *   }
 *
 * @author Karri Rasinmäki
 */

(function(app) {
	
	var db;
	if (app.currentProfile == "test") {
		db = new PouchDB("todai-test");
	}
	else {
		db = new PouchDB("todai");
	}
	
	/**
	 * Destroy database.
	 */
	function destroy() {
		db.destroy(function(err, info) {
			if (err) {
				console.warn(err);
			}
			else {
				console.info(info);
			}
		});
	}
	
	/**
	 * Throw error if doc does not have 
	 * _id field.
	 */
	function requireId(doc) {
		if (!doc._id) {
			throw "Id cannot be null";
		}
	}
	
	/**
	 * Throw error if doc does not have 
	 * _rev field.
	 */
	function requireRev(doc) {
		if (!doc._rev) {
			throw "Rev cannot be null";
		}
	}
	
	var todo = {
		
		TYPE: "todo",
		
		create: function(doc, callback) {
			delete doc._id;
			doc.type = todo.TYPE;
			db.post(doc, callback);
		},
		
		update: function(doc, callback) {
			requireId(doc);
			requireRev(doc);
			doc.type = todo.TYPE;
			db.put(doc, callback);
		},
		
		save: function(doc, callback) {
			try {
				this.update(doc, callback);
			}
			catch (ex) {
				this.create(doc, callback);
			}
		},
		
		get: function(id, callback) {
			db.get(id, callback);
		},
		
		remove: function(doc, callback) {
			requireId(doc);
			requireRev(doc);
			db.remove(doc, callback);
		},
		
		list: function(callback) {
			function map(doc) {
				if (doc.type === "todo") {
					emit(doc.caption, {caption: doc.caption, description: doc.description});
				}
			}
			db.query({map: map}, {reduce: false}, callback);
		},
		
		listTodaysTasks: function(callback) {
			function map(doc) {
				if (doc.type === "todo") {
					emit(doc._id, {
						caption: doc.caption, 
						description: doc.description,
						hours: Math.max(doc.estimateHours, 4)
					});
				}
			}
			db.query({map: map}, {reduce: false, limit: 4}, function(err, resp) {
				if (err) {
					callback(err, resp);
					return;
				}
				var totalHours = 0;
				for (var i = 0, l = resp.rows.length; i < l; ++i) {
					var row = resp.rows[i];
					if (totalHours > 8) {
						delete resp.rows[i];
					}
					else {
						totalHours += row.value.hours;
					}
				}
				callback(err, resp);
			});
		}
		
	};
	
	var category = {
		
		TYPE: "category",
		
		get: function(id, callback) {
			if (id === app.Category.Id.WORK) {
				callback(null, app.Category.work);
			}
			else if (id === app.Category.Id.FREE_TIME) {
				callback(null, app.Category.freetime);
			}
			else {
				callback("Category not found with id " + id, null);
			}
		},
		
		list: function(callback) {
			callback(null, {
				rows: [app.Category.work, app.Category.freetime],
				total_rows: 2
			});
		}
		
	};
	
	app.db = {
		db: db,
		destroy: destroy,
		todo: todo
	};
	
})(window.TodAi);


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
	
	/**
	 * Return how many hours this task 
	 * will take of day.
	 */
	function tasksDailyHours(doc) {
		var hoursLeft = (doc.estimateHours || 0) - (doc.userdHours || 0);
		return Math.min(hoursLeft, 4);
	}
	window.TodAi.tasksDailyHours = tasksDailyHours;
	
	/**
	 * Get given dates date at 00:00:00 o'clock. If no 
	 * date given use today's date.
	 */
	function dateToday(dateval) {
		var date;
		if (dateval) date = new Date(dateval);
		else date = new Date();

		date.setMilliseconds(0);
		date.setSeconds(0);
		date.setMinutes(0);
		date.setHours(0);
		return date;
	}
	window.TodAi.dateToday = dateToday;
	
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
		
		updateUsedHours: function(id, delta, callback) {
			var self = this;
			this.get(id, function(err, resp) {
				if (err) {
					callback(err, resp);
				}
				else {
					resp.usedHours += delta;
					resp.showDate = 0;
					self.save(resp, callback);
				}
			});
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
		
		/**
		 * Return date of list. If following rules match, request new 
		 * today's list and update this info data. Also provide 
		 * isNewDate=true.
		 *
		 * Rule:
		 *   there is no date record || 
		 *   date of list < today &&
		 *   (task list is empty || today it's over 5am)
		 *   
		 */
		dateOfList: function(callback) {
			var self = this;
			var id = "date-of-list";
			function returnNewDay() {
				self.requestNewTodaysTaskList(function(){});
			}
			function isItTimeForDayChange(doc, callback) {
				if (dateToday(doc.date) < dateToday()) {
					if ((new Date()).getHours() < 5) {
						this.listTodaysTasks(function(err, resp) {
							if (err) {
								callback(true);
								return;
							}
							else {
								callback(resp.rows.length <= 0);
							}
						});
					}
					else {
						callback(true);
						return;
					}
				}
				callback(false);
			}
			db.get(id, function(err, resp) {
				if (err) {
					returnNewDay();
				}
				else {
					isItTimeForDayChange(resp, function(bool) {
						if (bool) {
							resp.date = dateToday();
							returnNewDay(resp);
						}
						else {
							callback(err, resp);
						}
					});
				}
			});
		},
		
		updateDateOfList: function(callback) {
			var id = "date-of-list";
			db.get(id, function(err, resp) {
				if (!resp) {
					resp = {_id: id, date: dateToday()};
				}
				resp.date = dateToday();
				db.put(resp, function() {
					resp.isNewDay = true;
					callback(null, resp);
				});
			});
		},
		
		/**
		 * Generate new today's tasklist.
		 */
		requestNewTodaysTaskList: function(callback) {
			this.updateDateOfList(function(){});
			function map(doc) {
				var hoursLeft = (doc.estimateHours || 0) - (doc.userdHours || 0);
				if (doc.type === "todo" && hoursLeft > 0) {
					
					emit([doc.deadline, -hoursLeft], doc);
				}
			}
			db.query({map: map}, {reduce: false, limit: 4}, function(err, resp) {
				if (err) {
					callback(err, resp);
					return;
				}
				var toUpdate = [];
				var totalHours = 0;
				for (var i = 0, l = resp.rows.length; i < l; ++i) {
					var doc = resp.rows[i].value;
					var hours = tasksDailyHours(doc);
					if (totalHours + hours <= 8) {
						doc.showDate = app.dateToday();
						doc.dailyHours = hours;
						toUpdate.push(doc);
						totalHours += hours;
					}
				}
				db.bulkDocs(toUpdate, callback);
			});
		},
		
		/**
		 * List today's tasks.
		 */
		listTodaysTasks: function(callback, skipDateCheck) {
			var self = this;
			if (!skipDateCheck) {
				this.dateOfList(function() {
					self.listTodaysTasks(callback, true);
				});
				return;
			}
			function map(doc) {
				var hours = doc.dailyHours;
				
				if (doc.type === "todo" && doc.showDate != 0 && window.TodAi.dateToday(doc.showDate) <= window.TodAi.dateToday()) {
					emit([doc.deadline, hours], {
						caption: doc.caption, 
						description: doc.description,
						hours: hours
					});
				}
			}
			db.query({map: map}, {reduce: false, limit: 4}, function(err, resp) {
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

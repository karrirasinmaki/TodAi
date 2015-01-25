
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
	
	var dateToday = app.dateToday;
	var dateTomorrow = app.dateTomorrow;
	var daysInMilliseconds = app.daysInMilliseconds;
	
	var db, todo;
	
	/**
 	 * Open database
	 */
	function open() {
		if (app.currentProfile == "test") {
			db = new PouchDB("todai-test");
		}
		else {
			db = new PouchDB("todai");
		}
	}
	
	open();
	
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
		window.TodAi.db.todo.shouldHaveAi(doc);
		var hoursLeft = (doc.estimateHours || 0) - (doc.userdHours || 0);
		var hoursInFavor = doc.ai.hours;
		
		// Look from ai.hours where is most biggest favour for hour. 
		// The bigger the favour is, the more likely user will
		// mark it as done.
		var maxFav = null;
		var minFav = null;
		var maxFavIndex = 0; // index == hours
		for (var i = 0, l = hoursInFavor.length; i < l; ++i) {
			var fav = hoursInFavor[i];
			if (maxFav == null || maxFav < fav) {
				maxFav = fav;
				maxFavIndex = i;
			}
			if (minFav == null || minFav > fav) {
				minFav = fav;
			}
		}
		
		// If hoursToAssign is less than zero or 
		// way less than max fav, return max fav hours.
		// Otherwise return hoursToAssign.
		var hoursToAssign = Math.min(hoursLeft, 4);
		if (hoursInFavor[hoursToAssign] < 0 || hoursInFavor[hoursToAssign] < maxFav - 6) {
			return maxFavIndex + 1;
		}
		else {
			return hoursToAssign;
		}
	}
	window.TodAi.tasksDailyHours = tasksDailyHours;
	
	/**
	 * Is it time for day change?
	 *
	 * Rule:
	 *   there is no date record || 
	 *   date of list < today &&
	 *   (task list is empty || today it's over 5am)
	 */
	function isItTimeForDayChange(dateOfListDoc, callback) {		
		if (dateToday() <= dateToday(dateOfListDoc.date)) {
			callback(false);
			return;
		}
		// If it is not 5am yet, check if there is 
		// tasks left for today
		if ((new Date()).getHours() < 5) {
			todo.listTodaysTasks(function(err, resp) {
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
		callback(false);
	}
	
	todo = {
		
		TYPE: "todo",
		
		/**
 		 * If in doc obj there is no ai obj, create it
		 */
		shouldHaveAi: function(doc) {
			if (!doc.ai) doc.ai = {};
			if (!doc.ai.day) doc.ai.day = [];
			if (!doc.ai.hours) doc.ai.hours = [];
		},
		
		getListObject: function(doc) {
			return {
				caption: doc.caption, 
				description: doc.description,
				deadline: doc.deadline,
				estimateHours: doc.estimateHours,
				usedHours: doc.usedHours, 
				repeat: doc.repeat
			};
		},
		
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
		
		/**
		 * Updates used hours of given todo. If addition < 0, it means 
		 * just postponing task
		 * @param id
		 * @param addition how many hour's task was it
		 * @callback
		 */
		updateUsedHours: function(id, addition, callback) {
			var self = this;
			function train(doc, additionWas, trainValue) {
				window.TodAi.db.todo.shouldHaveAi(doc);
				doc.ai[dateToday().getDay()] += trainValue;
				doc.ai[additionWas] += trainValue;
			}
			this.get(id, function(err, resp) {
				if (err) {
					callback(err, resp);
				}
				else {
					if (addition <= 0) {
						train(resp, -addition, -1);
						addition = 0;
					}
					else {
						train(resp, addition, 1);
					}
					
					resp.usedHours += addition;
					if (resp.repeat > 0 && addition > 0) {
						resp.showDate = new Date(new Date(resp.showDate).getTime() + daysInMilliseconds(resp.repeat));
					}
					else {
						resp.showDate = 0;
					}
					self.save(resp, callback);
				}
			});
		},
		
		/**
		 * Postpone task.
		 * @param id
		 * @param addition how many hour's task was it
		 * @callback
		 */
		postpone: function(id, addition, callback) {
			this.updateUsedHours(id, -addition, callback);
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
					emit(doc._id, window.TodAi.db.todo.getListObject(doc));
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
				self.requestNewTodaysTaskList(function(){}, callback);
			}
			db.get(id, function(err, resp) {
				if (err) {
					returnNewDay();
				}
				else {
					isItTimeForDayChange(resp, function(bool) {
						console.log("Time for new date list?" + bool);
						if (bool) {
							resp.date = dateToday();
							returnNewDay();
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
				db.put(resp, function(err, resp) {
					resp.isNewDay = true;
					callback(null, resp);
				});
			});
		},
		
		/**
		 * Generate new today's tasklist.
		 */
		requestNewTodaysTaskList: function(callback, updateDateOfListCallback) {
			this.updateDateOfList(updateDateOfListCallback || function(){});
			function map(doc) {
				var hoursLeft = (doc.estimateHours || 0) - (doc.usedHours || 0);
				if (doc.type === "todo" && hoursLeft > 0) {
					window.TodAi.db.todo.shouldHaveAi(doc);
					emit([
						doc.deadline, // where deadline is closest
						-hoursLeft,   // where is most hours left
						-doc.ai.day[window.TodAi.dateToday().getDay()] // where this day is most likely to be marked as done
					], doc);
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
						doc.lastShowDate = doc.showDate;
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
		listTodaysTasks: function(callback) {
			var self = this;
			function map(doc) {
				var hours = doc.dailyHours;
				if (doc.type === "todo" && doc.showDate != 0 &&
				    window.TodAi.dateToday(doc.showDate) <= window.TodAi.dateToday()) {
					var listObj = window.TodAi.db.todo.getListObject(doc);
					listObj.hours = hours;
					emit([doc.deadline, hours], listObj);
				}
			}
			db.query({map: map}, {reduce: false, limit: 4}, function(err, resp) {
				callback(err, resp);
			});
		},
		
		/**
		 * List today's tasks.
		 */
		listWeeksTasks: function(callback) {
			var self = this;
			function map(doc) {
				var hoursLeft = (doc.estimateHours || 0) - (doc.usedHours || 0);
				if (doc.type === "todo" && doc.deadline != 0 && 
					(
						doc.repeat > 0 ||
						window.TodAi.dateToday(doc.deadline) <= new Date(window.TodAi.dateToday().getTime() + window.TodAi.daysInMilliseconds(7)) 
					)
				   ){
					var listObj = window.TodAi.db.todo.getListObject(doc);
					listObj.hours = hoursLeft;
					emit([doc.deadline, -hoursLeft], listObj);
				}
			}
			db.query({map: map}, {reduce: false}, function(err, resp) {
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
		open: open,
		destroy: destroy,
		todo: todo
	};
	
})(window.TodAi);

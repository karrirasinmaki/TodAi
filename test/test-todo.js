(function(app) {
	
	var db = app.db;
	var Todo = app.Todo;

	function _testGetTodo(todo, pass, fail, runTest) {
		var fn = _testGetTodo;
		db.todo.get(todo._id, function(err, resp) {
			if (err) {
				fail(fn, err);
			}
			else {
				if (resp.caption !== todo.caption) {
					fail(fn);
					console.warn("caption does not match");
				}
				else {
					pass(fn);
				}
			}
		});
	};

	function testCreateTodo(pass, fail, runTest) {
		var fn = testCreateTodo;
		var todo = new Todo();
		todo.caption = "The test is this";

		db.todo.create(todo, function(err, resp) {
			if (err) {
				fail(fn, err);
			}
			else {
				pass(fn);
				runTest(_testGetTodo, todo);
			}
		});
	};
	
	app.test.testCreateTodo = testCreateTodo;
	
})(window.TodAi);

(function(app) {
	app.addSampleData = function() {
		app.currentProfile = "dev";
		app.db.open();
		
		function rnd(val, round) {
			if (!val) val = 12;
			var out = Math.random() * val;
			if (round) {
				return Math.round(out);
			}
			else {
				return out;
			}
		}
		
		function airnd() {
			return Math.min(-rnd(12) + rnd(24), 12);
		}

		var todo = new app.Todo();
		todo.caption = "Test " + new Date().getTime();
		todo.description = "Test " + new Date().getTime();

		todo.ai = {
			days: [airnd(), airnd(), airnd(), airnd(), airnd(), airnd(), airnd()],
			hours: [airnd(), airnd(), airnd(), airnd(), airnd(), airnd(), airnd(), airnd()]
		};

		todo.notes = JSON.stringify(todo.ai);
		todo.deadline = new Date(new Date().getTime() + app.daysInMilliseconds(rnd(14, true)));
		todo.repeat = Math.random() > 0.8 ? rnd(30, true) : 0;

		todo.usedHours = rnd(60, true);
		todo.estimateHours = todo.usedHours + rnd(60, true);
		todo.showDate = 0; //new Date();
		todo.lastShowDate = 0; //new Date();
		
		app.db.todo.create(todo, function(err, resp) {
			if (err) {
				throw err;
			}
			else {
				console.log("Created:", todo);
			}
		});
	};
})(window.TodAi);
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

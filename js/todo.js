(function(app) {
	
	function Todo() {
		// this._id = undefined;
		
		this.caption = "";
		this.description = "";
		this.notes = "";
		this.deadline = new Date();
		this.estimateHours = null;
		this.userHours = 0;
		this.repeat = Todo.Repeat.NO_REPEAT;
		
		this.categoryId = app.Category.Id.WORK;
	}
	
	Todo.Repeat = {
		NO_REPEAT: 0,
		EVERY_DAY: 1,
		EVERY_SECOND_DAY: 2,
		EVERY_THIRD_DAY: 3,
		TWICE_A_WEEK: 4,
		ONCE_A_WEEK: 7
	};
	
	app.Todo = Todo;
	
})(window.TodAi);
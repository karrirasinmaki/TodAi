(function(app) {
	
	function Todo() {
		// this._id = undefined;
		
		this.caption = "";
		this.description = "";
		this.notes = "";
		this.deadline = new Date();
		this.estimateHours = 0;
		this.repeat = -1;
		
		this.usedHours = 0;
		this.showDate = 0; //new Date();
		this.lastShowDate = 0; //new Date();
		
		this.ai = {
			// stats when user has postponed. + = done, - = postpone
			days: [0, 0, 0, 0, 0, 0, 0],
			hours: [0, 0, 0, 0, 0, 0, 0, 0]
		};
		
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

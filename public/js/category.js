(function(app) {
	
	function Category() {
		this._id = undefined;
		
		this.caption = Category.Id.WORK;
		this.description = "";
	}
	
	Category.Id = {
		WORK: "work",
		FREE_TIME: "free time"
	};
	
	var categoryWork = new Category();
	categoryWork._id = Category.Id.WORK;
	categoryWork.caption = Category.Id.WORK;
	categoryWork.description = "";
	
	var categoryFreetime = new Category();
	categoryFreetime._id = Category.Id.FREE_TIME;
	categoryFreetime.caption = Category.Id.FREE_TIME;
	categoryFreetime.description = "";
	
	Category.work = categoryWork;
	Category.freetime = categoryFreetime;
	
	app.Category = Category;
	
})(window.TodAi);

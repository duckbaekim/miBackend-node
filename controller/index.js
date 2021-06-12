var models = require("../models");

let index = async (req, res) => {
	const test = [
	  { id: 1, name: "courses1" },
	  { id: 2, name: "courses2" },
	  { id: 3, name: "courses3" }
	];

	res.json(test);
}

module.exports = {
	index: index
};

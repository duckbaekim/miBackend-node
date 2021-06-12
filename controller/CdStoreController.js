var models = require("../models");

let cdStoreList = async (req, res) => {
	try{
		const dataList = await models.CD_Store.findAll({
			attributes: [
				'id', 
				'name', 
				'price', 
				'desc',
				'type',
				'normalCount',
				'specialCount',
				'isEnabled',
				'sequence'
				]
		});
		res.json(dataList);
	}catch(err){
		console.log(err);
	}
};

module.exports = {
	cdStoreList: cdStoreList
};

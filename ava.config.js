"use strict";

export default {
	files: [
		"./test_out/test/**/*.js",
		"!**/_*/*"
	],
	require: [
		"./test_out/test/_utility/env.js"
	]
};


// Convert a json object to a csv string
function convertJsonToCsv(jsonObject) {
	let csvString = '';
	let th_keys = Object.keys(jsonObject[0]);
	for (let i = 0; i < th_keys.length; i++) {
		th_keys[i] = "\"" + th_keys[i] + "\"";
	}
	csvString += th_keys.join(',') + '\n';
	for (let i = 0; i < jsonObject.length; i++) {
		let tr_keys = Object.keys(jsonObject[i]);
		for (let j = 0; j < tr_keys.length; j++) {
			csvString += ((jsonObject[i][tr_keys[j]] === null) || (jsonObject[i][tr_keys[j]] === undefined)) ? '\"\"' : "\"" + jsonObject[i][tr_keys[j]] + "\"";
			if (j < (tr_keys.length - 1)) {
				csvString += ',';
			}
		}
		csvString += '\n';
	}
	return csvString;
}


// Create and download a csv file
function createAndDownloadCsvFile(csvString, filename) {
	let dataStr = "data:text/csv;charset=utf-8," + encodeURI(csvString);
	let downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute("download", filename + ".csv");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}


// Process the phenotype data and create a phenotype dictionary
function processPhenotypeArray(phenotype_array) {
	var phenotype_dict = {};

	for (let i = 0; i < phenotype_array.length; i++) {
		// Split each phenotype line in the phenotype array into an array
		var phenotype_line_array = String(phenotype_array[i]).trim().split(/[,\t]/);

		// Remove the quotes from the phenotype values
		for (let j = 0; j < phenotype_line_array.length; j++) {
			phenotype_line_array[j] = phenotype_line_array[j].trim();
			if (phenotype_line_array[j].length > 1) {
				if (phenotype_line_array[j].charAt(0) === '"' && phenotype_line_array[j].charAt(phenotype_line_array[j].length - 1) === '"') {
					phenotype_line_array[j] = phenotype_line_array[j].substring(1, phenotype_line_array[j].length - 1);
				} else if (phenotype_line_array[j].charAt(0) === "'" && phenotype_line_array[j].charAt(phenotype_line_array[j].length - 1) === "'") {
					phenotype_line_array[j] = phenotype_line_array[j].substring(1, phenotype_line_array[j].length - 1);
				}
			}
		}

		// Put data into phenotype dictionary
		phenotype_dict[phenotype_line_array[0]] = phenotype_line_array[1];
	}

	return (phenotype_dict);
}


function constructTable(dataset, gene, jsonObject) {

	// Create table
	let detail_table = document.createElement("table");
	detail_table.setAttribute("style", "text-align:center; border:3px solid #000;");

	let detail_header_tr = document.createElement("tr");
	let header_array = Object.keys(jsonObject[0]);

	// Create an empty header for checkbox column
	var detail_th = document.createElement("th");
	detail_header_tr.appendChild(detail_th);

	// Loop through the header array to create table header
	for (let i = 0; i < header_array.length; i++) {
		// If the heading in the header is Phenotype_explain_percentage, change the heading to Phenotype_explain (%)
		if (header_array[i] == "Phenotype_explain_percentage") {
			var detail_th = document.createElement("th");
			detail_th.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
			detail_th.innerHTML = "Explained (%)";
			detail_header_tr.appendChild(detail_th);
		} else {
			var detail_th = document.createElement("th");
			detail_th.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
			detail_th.innerHTML = header_array[i];
			detail_header_tr.appendChild(detail_th);
		}
	}

	detail_table.appendChild(detail_header_tr);

	for (let i = 0; i < jsonObject.length; i++) {
		var detail_content_tr = document.createElement("tr");
		detail_content_tr.style.backgroundColor = ((i % 2) ? "#FFFFFF" : "#DDFFDD");

		// Create first column checkbox
		var detail_td = document.createElement("td");
		var detail_checkbox = document.createElement("input");
		detail_checkbox.type = "checkbox";
		detail_checkbox.id = String(gene) + "_checkbox_index_" + i;
		detail_checkbox.name = detail_checkbox.id;
		detail_td.appendChild(detail_checkbox);
		detail_content_tr.appendChild(detail_td);

		// Loop through the header array to create table content
		for (let j = 0; j < header_array.length; j++) {
			// All position combinations in the Combination_of_positions column need to link to Allele Catalog
			if (header_array[j] == "Combination_of_positions") {
				var detail_td = document.createElement("td");
				detail_td.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
				var detail_a = document.createElement('a');
				detail_a.id = String(gene) + "_" + header_array[j] + "_" + i;
				detail_a.target = "_blank";
				detail_a.href = "/SoybeanMADisTool/viewAlleleCatalog.php?dataset=" + dataset + "&gene=" + gene + "&chromosome=" + jsonObject[i]["Chromosome"] + "&positions=" + jsonObject[i]["Combination_of_positions"].split(";").join("%0D%0A");
				detail_a.innerHTML = jsonObject[i][header_array[j]];
				detail_a.style.color = "blue";
				detail_td.appendChild(detail_a);
				detail_content_tr.appendChild(detail_td);
			} else {
				var detail_td = document.createElement("td");
				detail_td.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
				detail_td.innerHTML = jsonObject[i][header_array[j]];
				detail_content_tr.appendChild(detail_td);
			}
		}
		detail_table.appendChild(detail_content_tr);
	}

	return detail_table;
}


function downloadMADisResults(dataset, gene, position_array, phenotype_dict, max_combination) {
	var phenotype_accession_array = Object.keys(phenotype_dict);

	$.ajax({
		url: './php/queryGenotypeData.php',
		type: 'GET',
		contentType: 'application/json',
		data: {
			Dataset: dataset,
			Gene: gene,
			Positions: position_array
		},
		success: function (response) {
			var res = JSON.parse(response);
			var res = res.data;

			// Put all the genotype accessions into an array and deduplicate the array
			var genotype_accession_array = [];
			for (let i = 0; i < res.length; i++) {
				genotype_accession_array.push(res[i]['Accession']);
				genotype_accession_array.push(res[i]['SoyKB_Accession']);
				genotype_accession_array.push(res[i]['GRIN_Accession']);
			}
			genotype_accession_array = genotype_accession_array.filter(function (value, index, array) {
				return array.indexOf(value) === index;
			});

			// Intersect phenotype accession array and genotype accession array
			var distinct_accession_array = genotype_accession_array.filter(function (element) { return phenotype_accession_array.indexOf(element) !== -1; });
			distinct_accession_array = distinct_accession_array.filter(function (element) { return phenotype_accession_array.indexOf(element) !== -1; });
			distinct_accession_array = distinct_accession_array.filter(function (element) { return genotype_accession_array.indexOf(element) !== -1; });
			distinct_accession_array = distinct_accession_array.filter(function (element) { return phenotype_accession_array.indexOf(element) !== -1; });
			distinct_accession_array = distinct_accession_array.filter(function (element) { return genotype_accession_array.indexOf(element) !== -1; });

			// Discard phenotype accessions that are not in the distinct accession array
			phenotype_accession_array = Object.keys(phenotype_dict);
			for (let i = 0; i < phenotype_accession_array.length; i++) {
				if (!(distinct_accession_array.includes(phenotype_accession_array[i]))) {
					delete phenotype_dict[phenotype_accession_array[i]];
				}
			}
			phenotype_accession_array = Object.keys(phenotype_dict);

			// Create a genotype dictionary
			var genotype_dict = {};
			for (let i = 0; i < res.length; i++) {
				var accession = null;
				if (distinct_accession_array.includes(res[i]['Accession'])) {
					accession = res[i]['Accession'];
				} else if (distinct_accession_array.includes(res[i]['SoyKB_Accession'])) {
					accession = res[i]['SoyKB_Accession'];
				} else if (distinct_accession_array.includes(res[i]['GRIN_Accession'])) {
					accession = res[i]['GRIN_Accession'];
				}

				if (accession != null) {
					var chromosome = res[i]['Chromosome'];
					var position = res[i]['Position'];
					var category_index = res[i]['Category_Index'];
					if (!(accession in genotype_dict)) {
						genotype_dict[accession] = {
							Chromosome: chromosome,
							Position_Category_Index: {}
						};
					}
					if (!("Chromosome" in genotype_dict[accession])) {
						genotype_dict[accession]['Chromosome'] = chromosome;
					}
					if (!("Position_Category_Index" in genotype_dict[accession])) {
						genotype_dict[accession]['Position_Category_Index'] = {};
					}
					if (!(position in genotype_dict[accession]["Position_Category_Index"])) {
						genotype_dict[accession]["Position_Category_Index"][position] = category_index;
					}
				}
			}

			// Perform MADis algorithm here
			var madis_result = runMADisAlgorithm(phenotype_dict, genotype_dict, max_combination);

			// Download MADis results
			if (madis_result.length > 0) {
				let csvString = convertJsonToCsv(madis_result);
				createAndDownloadCsvFile(csvString, "MADis_" + String(dataset) + "_" + String(gene) + "_data");
			} else {
				alert("Data is not downloadable!!!");
			}
		},
		error: function (xhr, status, error) {
			console.log('Error with code ' + xhr.status + ': ' + xhr.statusText);
		}
	});
}


function updateMADisResults(dataset, gene, position_array, phenotype_dict, max_combination) {
	var phenotype_accession_array = Object.keys(phenotype_dict);

	$.ajax({
		url: './php/queryGenotypeData.php',
		type: 'GET',
		contentType: 'application/json',
		data: {
			Dataset: dataset,
			Gene: gene,
			Positions: position_array
		},
		success: function (response) {
			var res = JSON.parse(response);
			var res = res.data;

			// Put all the genotype accessions into an array and deduplicate the array
			var genotype_accession_array = [];
			for (let i = 0; i < res.length; i++) {
				genotype_accession_array.push(res[i]['Accession']);
				genotype_accession_array.push(res[i]['SoyKB_Accession']);
				genotype_accession_array.push(res[i]['GRIN_Accession']);
			}
			genotype_accession_array = genotype_accession_array.filter(function (value, index, array) {
				return array.indexOf(value) === index;
			});

			// Intersect phenotype accession array and genotype accession array
			var distinct_accession_array = genotype_accession_array.filter(function (element) { return phenotype_accession_array.indexOf(element) !== -1; });
			distinct_accession_array = distinct_accession_array.filter(function (element) { return phenotype_accession_array.indexOf(element) !== -1; });
			distinct_accession_array = distinct_accession_array.filter(function (element) { return genotype_accession_array.indexOf(element) !== -1; });
			distinct_accession_array = distinct_accession_array.filter(function (element) { return phenotype_accession_array.indexOf(element) !== -1; });
			distinct_accession_array = distinct_accession_array.filter(function (element) { return genotype_accession_array.indexOf(element) !== -1; });

			// Discard phenotype accessions that are not in the distinct accession array
			phenotype_accession_array = Object.keys(phenotype_dict);
			for (let i = 0; i < phenotype_accession_array.length; i++) {
				if (!(distinct_accession_array.includes(phenotype_accession_array[i]))) {
					delete phenotype_dict[phenotype_accession_array[i]];
				}
			}
			phenotype_accession_array = Object.keys(phenotype_dict);

			// Create a genotype dictionary
			var genotype_dict = {};
			for (let i = 0; i < res.length; i++) {
				var accession = null;
				if (distinct_accession_array.includes(res[i]['Accession'])) {
					accession = res[i]['Accession'];
				} else if (distinct_accession_array.includes(res[i]['SoyKB_Accession'])) {
					accession = res[i]['SoyKB_Accession'];
				} else if (distinct_accession_array.includes(res[i]['GRIN_Accession'])) {
					accession = res[i]['GRIN_Accession'];
				}

				if (accession != null) {
					var chromosome = res[i]['Chromosome'];
					var position = res[i]['Position'];
					var category_index = res[i]['Category_Index'];
					if (!(accession in genotype_dict)) {
						genotype_dict[accession] = {
							Chromosome: chromosome,
							Position_Category_Index: {}
						};
					}
					if (!("Chromosome" in genotype_dict[accession])) {
						genotype_dict[accession]['Chromosome'] = chromosome;
					}
					if (!("Position_Category_Index" in genotype_dict[accession])) {
						genotype_dict[accession]['Position_Category_Index'] = {};
					}
					if (!(position in genotype_dict[accession]["Position_Category_Index"])) {
						genotype_dict[accession]["Position_Category_Index"][position] = category_index;
					}
				}
			}

			// Perform MADis algorithm here
			var madis_result = runMADisAlgorithm(phenotype_dict, genotype_dict, max_combination);

			// Display MADis results
			if (madis_result.length > 0) {
				// Clean the MADis result div innerHTML
				document.getElementById('madis_result_' + gene).innerHTML = "";

				let uncheck_all_button = document.createElement("button");
				uncheck_all_button.innerHTML = "Uncheck All";
				uncheck_all_button.addEventListener('click', function () {
					// Get the IDs of all the checkboxes that are related to the selected gene
					let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
					for (let i = 0; i < checkbox_ids.length; i++) {
						checkbox_ids[i].checked = false;
					}
				});
				document.getElementById('madis_result_' + gene).appendChild(uncheck_all_button);

				let check_all_button = document.createElement("button");
				check_all_button.innerHTML = "Check all";
				check_all_button.style.marginLeft = "10px";
				check_all_button.addEventListener('click', function () {
					// Get the IDs of all the checkboxes that are related to the selected gene
					let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
					for (let i = 0; i < checkbox_ids.length; i++) {
						checkbox_ids[i].checked = true;
					}
				});
				document.getElementById('madis_result_' + gene).appendChild(check_all_button);

				if (madis_result.length > 10) {
					let check_top_10_rows_button = document.createElement("button");
					check_top_10_rows_button.innerHTML = "Check top 10 rows";
					check_top_10_rows_button.style.marginLeft = "10px";
					check_top_10_rows_button.addEventListener('click', function () {
						// Get the IDs of all the checkboxes that are related to the selected gene
						let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
						let num_of_rows_need_check = Math.min(10, checkbox_ids.length);
						for (let i = 0; i < checkbox_ids.length; i++) {
							if (i < num_of_rows_need_check) {
								checkbox_ids[i].checked = true;
							} else {
								checkbox_ids[i].checked = false;
							}
						}
					});
					document.getElementById('madis_result_' + gene).appendChild(check_top_10_rows_button);
				}

				if (madis_result.length >= 20) {
					let check_top_20_rows_button = document.createElement("button");
					check_top_20_rows_button.innerHTML = "Check top 20 rows";
					check_top_20_rows_button.style.marginLeft = "10px";
					check_top_20_rows_button.addEventListener('click', function () {
						// Get the IDs of all the checkboxes that are related to the selected gene
						let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
						let num_of_rows_need_check = Math.min(20, checkbox_ids.length);
						for (let i = 0; i < checkbox_ids.length; i++) {
							if (i < num_of_rows_need_check) {
								checkbox_ids[i].checked = true;
							} else {
								checkbox_ids[i].checked = false;
							}
						}
					});
					document.getElementById('madis_result_' + gene).appendChild(check_top_20_rows_button);
				}

				if (madis_result.length >= 50) {
					let check_top_50_rows_button = document.createElement("button");
					check_top_50_rows_button.innerHTML = "Check top 50 rows";
					check_top_50_rows_button.style.marginLeft = "10px";
					check_top_50_rows_button.addEventListener('click', function () {
						// Get the IDs of all the checkboxes that are related to the selected gene
						let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
						let num_of_rows_need_check = Math.min(50, checkbox_ids.length);
						for (let i = 0; i < checkbox_ids.length; i++) {
							if (i < num_of_rows_need_check) {
								checkbox_ids[i].checked = true;
							} else {
								checkbox_ids[i].checked = false;
							}
						}
					});
					document.getElementById('madis_result_' + gene).appendChild(check_top_50_rows_button);
				}

				if (madis_result.length * 0.01 >= 1) {
					let check_top_1_percent_button = document.createElement("button");
					check_top_1_percent_button.innerHTML = "Check top 1 percent";
					check_top_1_percent_button.style.marginLeft = "10px";
					check_top_1_percent_button.addEventListener('click', function () {
						// Get the IDs of all the checkboxes that are related to the selected gene
						let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
						let num_of_rows_need_check = Math.min(parseInt(checkbox_ids.length * 0.01), checkbox_ids.length);
						for (let i = 0; i < checkbox_ids.length; i++) {
							if (i < num_of_rows_need_check) {
								checkbox_ids[i].checked = true;
							} else {
								checkbox_ids[i].checked = false;
							}
						}
					});
					document.getElementById('madis_result_' + gene).appendChild(check_top_1_percent_button);
				}

				if (madis_result.length * 0.05 >= 1) {
					let check_top_5_percent_button = document.createElement("button");
					check_top_5_percent_button.innerHTML = "Check top 5 percent";
					check_top_5_percent_button.style.marginLeft = "10px";
					check_top_5_percent_button.addEventListener('click', function () {
						// Get the IDs of all the checkboxes that are related to the selected gene
						let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
						let num_of_rows_need_check = Math.min(parseInt(checkbox_ids.length * 0.05), checkbox_ids.length);
						for (let i = 0; i < checkbox_ids.length; i++) {
							if (i < num_of_rows_need_check) {
								checkbox_ids[i].checked = true;
							} else {
								checkbox_ids[i].checked = false;
							}
						}
					});
					document.getElementById('madis_result_' + gene).appendChild(check_top_5_percent_button);
				}

				if (madis_result.length * 0.1 >= 1) {
					let check_top_10_percent_button = document.createElement("button");
					check_top_10_percent_button.innerHTML = "Check top 10 percent";
					check_top_10_percent_button.style.marginLeft = "10px";
					check_top_10_percent_button.addEventListener('click', function () {
						// Get the IDs of all the checkboxes that are related to the selected gene
						let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
						let num_of_rows_need_check = Math.min(parseInt(checkbox_ids.length * 0.1), checkbox_ids.length);
						for (let i = 0; i < checkbox_ids.length; i++) {
							if (i < num_of_rows_need_check) {
								checkbox_ids[i].checked = true;
							} else {
								checkbox_ids[i].checked = false;
							}
						}
					});
					document.getElementById('madis_result_' + gene).appendChild(check_top_10_percent_button);
				}

				if (madis_result.length * 0.2 >= 1) {
					let check_top_20_percent_button = document.createElement("button");
					check_top_20_percent_button.innerHTML = "Check top 20 percent";
					check_top_20_percent_button.style.marginLeft = "10px";
					check_top_20_percent_button.addEventListener('click', function () {
						// Get the IDs of all the checkboxes that are related to the selected gene
						let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
						let num_of_rows_need_check = Math.min(parseInt(checkbox_ids.length * 0.2), checkbox_ids.length);
						for (let i = 0; i < checkbox_ids.length; i++) {
							if (i < num_of_rows_need_check) {
								checkbox_ids[i].checked = true;
							} else {
								checkbox_ids[i].checked = false;
							}
						}
					});
					document.getElementById('madis_result_' + gene).appendChild(check_top_20_percent_button);
				}

				// if (madis_result.length * 0.5 >= 1) {
				// 	let check_top_50_percent_button = document.createElement("button");
				// 	check_top_50_percent_button.innerHTML = "Check top 50 percent";
				// 	check_top_50_percent_button.style.marginLeft = "10px";
				// 	check_top_50_percent_button.addEventListener('click', function () {
				// 		// Get the IDs of all the checkboxes that are related to the selected gene
				// 		let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
				// 		let num_of_rows_need_check = Math.min(parseInt(checkbox_ids.length * 0.5), checkbox_ids.length);
				// 		for (let i = 0; i < checkbox_ids.length; i++) {
				// 			if (i < num_of_rows_need_check) {
				// 				checkbox_ids[i].checked = true;
				// 			} else {
				// 				checkbox_ids[i].checked = false;
				// 			}
				// 		}
				// 	});
				// 	document.getElementById('madis_result_' + gene).appendChild(check_top_50_percent_button);
				// }

				// Empty lines
				document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));
				document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));

				// Compute MADis layer 2 button
				let compute_madis_layer_2_button = document.createElement("button");
				compute_madis_layer_2_button.style.backgroundColor = "#DDFFDD";
				compute_madis_layer_2_button.innerHTML = "Compute with MADis Algorithm for Selected Positions";
				compute_madis_layer_2_button.id = "compute_madis_layer_2_button__" + gene;
				compute_madis_layer_2_button.name = compute_madis_layer_2_button.id;
				compute_madis_layer_2_button.addEventListener('click', function () {
					let position_array = [];

					// Get the IDs of all the checkboxes that are related to the selected gene
					let checkbox_ids = document.querySelectorAll('input[id^="' + gene + '_checkbox_index_"]');
					for (let i = 0; i < checkbox_ids.length; i++) {
						// If the checkbox is checked, get the row index and use the row index to get the positions
						if (checkbox_ids[i].checked) {
							// Get row index
							let row_index = checkbox_ids[i].id.replace(/.*_checkbox_index_/, '');

							// Get positions using row index and push them to the position array
							let temp_positions = document.getElementById(String(gene) + "_Combination_of_positions_" + row_index).innerHTML;
							if (temp_positions != "") {
								temp_positions.split(';').forEach(function (item, index, array) {
									if (!(position_array.includes(item))) {
										position_array.push(item);
									}
								});
							}
						}
					}
					position_array.sort();

					if (position_array.length < 1) {
						alert("Please select any checkboxes of this gene to continue the calculation!!!");
					} else {
						window.open("viewMADisResultsLayer2.php?dataset=" + dataset + "&gene=" + gene + "&phenotype_file_name=" + phenotype_file_name + "&positions=" + position_array.join("%0D%0A"));
					}

				});
				document.getElementById('madis_result_' + gene).appendChild(compute_madis_layer_2_button);

				// Download button
				let download_button = document.createElement("button");
				download_button.innerHTML = "Download All Results";
				download_button.style.marginLeft = "10px";
				download_button.addEventListener('click', function () {
					downloadMADisResults(dataset, gene, [], phenotype_dict, max_combination);
				});
				document.getElementById('madis_result_' + gene).appendChild(download_button);

				// Empty lines
				document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));
				document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));

				// Display MADis results in a table
				document.getElementById('madis_result_' + gene).appendChild(
					constructTable(dataset, gene, madis_result)
				);
				document.getElementById('madis_result_' + gene).style.overflow = 'scroll';
			} else {
				// Clean the MADis result div innerHTML
				document.getElementById('madis_result_' + gene).innerHTML = "";

				// Display error message
				let error_message = document.createElement("p");
				error_message.innerHTML = "Unable to construct table!!!";
				document.getElementById('madis_result_' + gene).appendChild(error_message);
				document.getElementById('madis_result_' + gene).style.overflow = 'visible';
			}
		},
		error: function (xhr, status, error) {
			console.log('Error with code ' + xhr.status + ': ' + xhr.statusText);
		}
	});
}


function updateAllMADisResults(dataset, gene_array, phenotype_dict, max_combination) {
	for (let i = 0; i < gene_array.length; i++) {
		document.getElementById('madis_result_' + gene_array[i]).innerHTML = "Loading...";
	}
	for (let i = 0; i < gene_array.length; i++) {
		updateMADisResults(dataset, gene_array[i], [], phenotype_dict, max_combination);
	}
}

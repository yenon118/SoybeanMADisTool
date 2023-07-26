
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


function generateCombinations(arr, max_combination) {
	const combinations = [];

	// Recursive function to generate combinations
	function generate(currentCombo, remainingElements, size) {
		if (size === 0) {
			combinations.push(currentCombo);
			return;
		}

		for (let i = 0; i < remainingElements.length; i++) {
			const newCombo = currentCombo.concat(remainingElements[i]);
			const newRemaining = remainingElements.slice(i + 1);
			generate(newCombo, newRemaining, size - 1);
		}
	}

	// Generate combinations of different sizes
	for (let size = 2; size <= max_combination; size++) {
		generate([], arr, size);
	}

	return combinations;
}


function runMADisAlgorithm(phenotype_dict, genotype_dict, max_combination) {
	var d_score = {
		"10": -1,
		"01": -1,
		"20": -3,
		"21": -3,
		"30": -6,
		"31": -6,
		"40": -10,
		"41": -10,
		"50": -15,
		"51": -15,
		"60": -21,
		"61": -21,
		"70": -28,
		"71": -28,
		"80": -36,
		"81": -36,
		"90": -45,
		"91": -45
	}

	// Get the phenotype and the genotype accessions
	var phenotype_accession_array = Object.keys(phenotype_dict);
	var genotype_accession_array = Object.keys(genotype_dict);

	// Get the total number of accessions
	var N_tot = phenotype_accession_array.length;

	// Get the total number of wild type and mutant phenotype accessions
	var n_wt_p = 0;
	var n_mut_p = 0;
	for (let i = 0; i < phenotype_accession_array.length; i++) {
		if (phenotype_dict[phenotype_accession_array[i]] == 1) {
			n_mut_p = n_mut_p + 1;
		} else {
			n_wt_p = n_wt_p + 1;
		}
	}

	// Collect all the unique chromosomes and positions from the genotype dictionary
	var chromosome_array = [];
	var position_array = [];
	for (let i = 0; i < genotype_accession_array.length; i++) {
		if (!(chromosome_array.includes(genotype_dict[genotype_accession_array[i]]['Chromosome']))) {
			chromosome_array.push(genotype_dict[genotype_accession_array[i]]['Chromosome']);
		}
		var temp_position_array = Object.keys(genotype_dict[genotype_accession_array[i]]["Position_Category_Index"]);
		for (let j = 0; j < temp_position_array.length; j++) {
			if (!(position_array.includes(temp_position_array[j]))) {
				position_array.push(temp_position_array[j]);
			}
		}
	}

	// Generate all the combinations of positions
	var combs = generateCombinations(position_array, max_combination);
	combs.sort((a, b) => (a.length < b.length) ? 1 : -1);
	// Currently, we are limiting the number of combinations to 5000
	if (combs.length > 5000) {
		combs = combs.slice(0, 5000);
	}

	var res_dict_array = [];
	for (let i = 0; i < combs.length; i++) {
		// Generate a result dictionary for each combination
		var res_dict = {
			'Chromosome': chromosome_array.join(';'),
			'Combination_of_positions': combs[i].join(';'),
			'N_positions': combs[i].length,
			'Score': 0,
			'N_total': N_tot,
			'N_WT': n_wt_p,
			'N_WT_match': 0,
			'N_MUT': n_mut_p,
			'N_MUT_match': 0,
			'Phenotype_explain_percentage': 0
		};

		var geno_sum = {};
		for (let j = 0; j < genotype_accession_array.length; j++) {
			var accession = genotype_accession_array[j];
			if (!(accession in geno_sum)) {
				geno_sum[accession] = 0;
			}

			// Sum the positions in combinations if it is alternate allele
			for (let k = 0; k < combs[i].length; k++) {
				var position = combs[i][k];
				try {
					if (genotype_dict[accession]["Position_Category_Index"][position] == 1) {
						geno_sum[accession] = geno_sum[accession] + 1;
					}
				} catch (error) {
					console.log(error);
				}
			}

			// Get the remainder of the sum (no mutation will be 0 as total combination is less than 10)
			geno_sum[accession] = geno_sum[accession] % 10

			// Calculate the score
			if (geno_sum[accession] == parseInt(phenotype_dict[accession])) {
				res_dict['Score'] = res_dict['Score'] + 1;
				if (parseInt(phenotype_dict[accession]) == 1) {
					res_dict['N_MUT_match'] = res_dict['N_MUT_match'] + 1;
				} else {
					res_dict['N_WT_match'] = res_dict['N_WT_match'] + 1;
				}
			} else {
				res_dict['Score'] = res_dict['Score'] + d_score[String(geno_sum[accession]) + String(phenotype_dict[accession])]
			}
		}

		res_dict['Phenotype_explain_percentage'] = parseFloat(100 * (res_dict['N_MUT_match'] + res_dict['N_WT_match']) / res_dict['N_total']).toFixed(2);

		res_dict_array.push(res_dict);
	}

	res_dict_array.sort((a, b) => (a.Phenotype_explain_percentage < b.Phenotype_explain_percentage) ? 1 : -1);

	return (res_dict_array);
}


function constructTable(dataset, gene, jsonObject) {

	// Create table
	let detail_table = document.createElement("table");
	detail_table.setAttribute("style", "text-align:center; border:3px solid #000;");

	let detail_header_tr = document.createElement("tr");
	let header_array = Object.keys(jsonObject[0]);
	for (let i = 0; i < header_array.length; i++) {
		// If the heading in the header is Phenotype_explain_percentage, change the heading to Phenotype_explain (%)
		if (header_array[i] == "Phenotype_explain_percentage") {
			var detail_th = document.createElement("th");
			detail_th.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
			detail_th.innerHTML = "Phenotype_explain (%)";
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
		for (let j = 0; j < header_array.length; j++) {
			// All position combinations in the Combination_of_positions column need to link to Allele Catalog
			if (header_array[j] == "Combination_of_positions") {
				var detail_td = document.createElement("td");
				detail_td.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
				var detail_a = document.createElement('a');
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


function downloadMADisResults(dataset, gene, phenotype_dict, max_combination) {
	var phenotype_accession_array = Object.keys(phenotype_dict);

	$.ajax({
		url: './php/queryGenotypeData.php',
		type: 'GET',
		contentType: 'application/json',
		data: {
			Dataset: dataset,
			Gene: gene
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


function updateMADisResults(dataset, gene, phenotype_dict, max_combination) {
	var phenotype_accession_array = Object.keys(phenotype_dict);

	$.ajax({
		url: './php/queryGenotypeData.php',
		type: 'GET',
		contentType: 'application/json',
		data: {
			Dataset: dataset,
			Gene: gene
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
				document.getElementById('madis_result_' + gene).innerHTML = "";
				let download_button = document.createElement("button");
				download_button.innerHTML = "Download";
				download_button.addEventListener('click', function () {
					downloadMADisResults(dataset, gene, phenotype_dict, max_combination);
				});
				document.getElementById('madis_result_' + gene).appendChild(download_button);
				document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));
				document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));
				document.getElementById('madis_result_' + gene).appendChild(
					constructTable(dataset, gene, madis_result)
				);
				document.getElementById('madis_result_' + gene).style.overflow = 'scroll';
			} else {
				document.getElementById('madis_result_' + gene).innerHTML = "";
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
		updateMADisResults(dataset, gene_array[i], phenotype_dict, max_combination)
	}
}


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
			if (j < (tr_keys.length-1)) {
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
function processPhenotypeArray(phenotype_array){
	var phenotype_dict = {};

	for (let i = 0; i < phenotype_array.length; i++) {
		// Split each phenotype line in the phenotype array into an array
		var phenotype_line_array = String(phenotype_array[i]).trim().split(/[,\t]/);

		// Remove the quotes from the phenotype values
		for (let j = 0; j < phenotype_line_array.length; j++) {
			phenotype_line_array[j] = phenotype_line_array[j].trim();
			if (phenotype_line_array[j].length > 1) {
				if (phenotype_line_array[j].charAt(0) === '"' && phenotype_line_array[j].charAt(phenotype_line_array[j].length-1) === '"') {
					phenotype_line_array[j] = phenotype_line_array[j].substring(1,phenotype_line_array[j].length-1);
				} else if (phenotype_line_array[j].charAt(0) === "'" && phenotype_line_array[j].charAt(phenotype_line_array[j].length-1) === "'") {
					phenotype_line_array[j] = phenotype_line_array[j].substring(1,phenotype_line_array[j].length-1);
				}
			}
		}

		// Put data into phenotype dictionary
		phenotype_dict[phenotype_line_array[0]] = phenotype_line_array[1];
	}

	return(phenotype_dict);
}


function deduplicatePhenotypeDictAndGenotypeDict(phenotype_dict, genotype_dict) {
	var phenotype_accession_array = Object.keys(phenotype_dict);
	var genotype_accession_array = Object.keys(genotype_dict);

	// Intersect the phenotype dict and the genotype dict
	var genotype_accession_need_discard = [];
	for (let i = 0; i < genotype_accession_array.length; i++) {
		if (!(phenotype_accession_array.includes(genotype_accession_array[i]))) {
			genotype_accession_need_discard.push(genotype_accession_array[i]);
		}
	}
	if (genotype_accession_need_discard.length > 0) {
		for (let i = 0; i < genotype_accession_need_discard.length; i++) {
			delete genotype_dict[genotype_accession_need_discard[i]];
		}
	}
	genotype_accession_array = Object.keys(genotype_dict);

	var phenotype_accession_need_discard = [];
	for (let i = 0; i < phenotype_accession_array.length; i++) {
		if (!(genotype_accession_array.includes(phenotype_accession_array[i]))) {
			phenotype_accession_need_discard.push(phenotype_accession_array[i]);
		}
	}
	if (phenotype_accession_need_discard.length > 0) {
		for (let i = 0; i < phenotype_accession_need_discard.length; i++) {
			delete phenotype_dict[phenotype_accession_need_discard[i]];
		}
	}
	phenotype_accession_array = Object.keys(phenotype_dict);

	var genotype_accession_need_discard = [];
	for (let i = 0; i < genotype_accession_array.length; i++) {
		if (!(phenotype_accession_array.includes(genotype_accession_array[i]))) {
			genotype_accession_need_discard.push(genotype_accession_array[i]);
		}
	}
	if (genotype_accession_need_discard.length > 0) {
		for (let i = 0; i < genotype_accession_need_discard.length; i++) {
			delete genotype_dict[genotype_accession_need_discard[i]];
		}
	}
	genotype_accession_array = Object.keys(genotype_dict);

	var phenotype_accession_need_discard = [];
	for (let i = 0; i < phenotype_accession_array.length; i++) {
		if (!(genotype_accession_array.includes(phenotype_accession_array[i]))) {
			phenotype_accession_need_discard.push(phenotype_accession_array[i]);
		}
	}
	if (phenotype_accession_need_discard.length > 0) {
		for (let i = 0; i < phenotype_accession_need_discard.length; i++) {
			delete phenotype_dict[phenotype_accession_need_discard[i]];
		}
	}
	phenotype_accession_array = Object.keys(phenotype_dict);

	return({"Phenotype": phenotype_dict, "Genotype": genotype_dict});
}


function generateCombinations(arr) {
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
	for (let size = 2; size <= 7; size++) {
		generate([], arr, size);
	}

	return combinations;
}


function runMADisAlgorithm(phenotype_dict, genotype_dict) {
	var d_score ={
		"10":-1,
		"01":-1,
		"20":-3,
		"21":-3,
		"30":-6,
		"31":-6,
		"40":-10,
		"41":-10,
		"50":-15,
		"51":-15,
		"60":-21,
		"61":-21,
		"70":-28,
		"71":-28,
		"80":-36,
		"81":-36,
		"90":-45,
		"91":-45
	}

	// Get the phenotype and the genotype accessions
	var phenotype_accession_array = Object.keys(phenotype_dict);
	var genotype_accession_array = Object.keys(genotype_dict);

	// Get the total number of accessions
	var N = phenotype_accession_array.length;

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

	// Collect all the positions from the genotype dictionary
	var position_array = [];
	for (let i = 0; i < genotype_accession_array.length; i++) {
		var temp_position_array = Object.keys(genotype_dict[genotype_accession_array[i]]);
		for (let j = 0; j < temp_position_array.length; j++) {
			if (!(position_array.includes(temp_position_array[j]))) {
				position_array.push(temp_position_array[j]);
			}
		}
	}

	// Generate all the combinations of positions
	var combs = generateCombinations(position_array);
	combs.sort((a, b) => (a.length < b.length) ? 1 : -1);
	// Currently, we are limiting the number of combinations to 500
	if (combs.length > 500) {
		combs = combs.slice(0, 500);
	}

	var res_dict_array = [];
	for (let i = 0; i < combs.length; i++) {
		// Generate a result dictionary for each combination
		var res_dict = {
			'Position_combination': combs[i].join(';'),
			'N_position_combination': combs[i].length,
			'Score': 0,
			'N': N,
			'N_WT_pheno': n_wt_p,
			'N_WT_corr_pred': 0,
			'N_MUT_pheno': n_mut_p,
			'N_MUT_corr_pred': 0,
			'Percentage_explain_phenotype': 0
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
					if (genotype_dict[accession][position] == 1) {
						geno_sum[accession] = geno_sum[accession] + 1;
					}
				  } catch (error) {
					console.error(error);
				  }
			}

			// Get the remainder of the sum (no mutation will be 0 as total combination is less than 10)
			geno_sum[accession] = geno_sum[accession] % 10

			// Calculate the score
			if (geno_sum[accession] == parseInt(phenotype_dict[accession])) {
				res_dict['Score'] = res_dict['Score'] + 1;
				if (parseInt(phenotype_dict[accession]) == 1) {
					res_dict['N_MUT_corr_pred'] = res_dict['N_MUT_corr_pred'] + 1;
				} else {
					res_dict['N_WT_corr_pred'] = res_dict['N_WT_corr_pred'] + 1;
				}
			} else {
				res_dict['Score'] = res_dict['Score'] + d_score[String(geno_sum[accession])+String(phenotype_dict[accession])]
			}
		}

		res_dict['Percentage_explain_phenotype'] = 100 * (res_dict['N_MUT_corr_pred'] + res_dict['N_WT_corr_pred']) / res_dict['N'];

		res_dict_array.push(res_dict);
	}

	res_dict_array.sort((a, b) => (a.Percentage_explain_phenotype < b.Percentage_explain_phenotype) ? 1 : -1);

	return(res_dict_array);
}


function constructTable(jsonObject) {

	// Create table
	let detail_table = document.createElement("table");
	detail_table.setAttribute("style", "text-align:center; border:3px solid #000;");

	let detail_header_tr = document.createElement("tr");
	let header_array = Object.keys(jsonObject[0]);
	for (let i = 0; i < header_array.length; i++) {
		var detail_th = document.createElement("th");
		detail_th.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
		detail_th.innerHTML = header_array[i];
		detail_header_tr.appendChild(detail_th);
	}

	detail_table.appendChild(detail_header_tr);

	for (let i = 0; i < jsonObject.length; i++) {
		var detail_content_tr = document.createElement("tr");
		detail_content_tr.style.backgroundColor = ((i%2) ? "#FFFFFF" : "#DDFFDD");
		for (let j = 0; j < header_array.length; j++) {
			var detail_td = document.createElement("td");
			detail_td.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
			detail_td.innerHTML = jsonObject[i][header_array[j]];
			detail_content_tr.appendChild(detail_td);
		}
		detail_table.appendChild(detail_content_tr);
	}

	return detail_table;
}


function downloadMADisResults(dataset, gene, phenotype_dict){
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

			// Create a genotype dictionary
			var genotype_dict = {};
			for (let i = 0; i < res.length; i++) {
				if (phenotype_accession_array.includes(res[i]['Accession'])) {
					var accession = res[i]['Accession'];
					var position = res[i]['Position'];
					var category_index = res[i]['Category_Index'];
					if (!(accession in genotype_dict)) {
						genotype_dict[accession] = {};
					}
					if (!(position in genotype_dict[accession])) {
						genotype_dict[accession][position] = category_index;
					}
				} else if (phenotype_accession_array.includes(res[i]['SoyKB_Accession'])) {
					var accession = res[i]['SoyKB_Accession'];
					var position = res[i]['Position'];
					var category_index = res[i]['Category_Index'];
					if (!(accession in genotype_dict)) {
						genotype_dict[accession] = {};
					}
					if (!(position in genotype_dict[accession])) {
						genotype_dict[accession][position] = category_index;
					}
				} else if (phenotype_accession_array.includes(res[i]['GRIN_Accession'])) {
					var accession = res[i]['GRIN_Accession'];
					var position = res[i]['Position'];
					var category_index = res[i]['Category_Index'];
					if (!(accession in genotype_dict)) {
						genotype_dict[accession] = {};
					}
					if (!(position in genotype_dict[accession])) {
						genotype_dict[accession][position] = category_index;
					}
				}
			}

			// Deduplicate phenotype dictionary and genotype dictionary
			var pheno_geno_dict = deduplicatePhenotypeDictAndGenotypeDict(phenotype_dict, genotype_dict);
			phenotype_dict = pheno_geno_dict['Phenotype'];
			genotype_dict = pheno_geno_dict['Genotype'];

			// Perform MADis algorithm here
			var madis_result = runMADisAlgorithm(phenotype_dict, genotype_dict);

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


function updateMADisResults(dataset, gene, phenotype_dict){
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

			// Discard accessions that are not in the phenotype dictionary
			// var discard_indexes = [];
			// for (let i = 0; i < res.length; i++) {
			// 	if (!(phenotype_accession_array.includes(res[i]['Accession']) || phenotype_accession_array.includes(res[i]['SoyKB_Accession']) || phenotype_accession_array.includes(res[i]['GRIN_Accession']))) {
			// 		discard_indexes.push(i);
			// 	}
			// }
			// discard_indexes.reverse();
			// for (let i = 0; i < discard_indexes.length; i++) {
			// 	res.splice(discard_indexes[i], 1);
			// }

			// Create a genotype dictionary
			var genotype_dict = {};
			for (let i = 0; i < res.length; i++) {
				if (phenotype_accession_array.includes(res[i]['Accession'])) {
					var accession = res[i]['Accession'];
					var position = res[i]['Position'];
					var category_index = res[i]['Category_Index'];
					if (!(accession in genotype_dict)) {
						genotype_dict[accession] = {};
					}
					if (!(position in genotype_dict[accession])) {
						genotype_dict[accession][position] = category_index;
					}
				} else if (phenotype_accession_array.includes(res[i]['SoyKB_Accession'])) {
					var accession = res[i]['SoyKB_Accession'];
					var position = res[i]['Position'];
					var category_index = res[i]['Category_Index'];
					if (!(accession in genotype_dict)) {
						genotype_dict[accession] = {};
					}
					if (!(position in genotype_dict[accession])) {
						genotype_dict[accession][position] = category_index;
					}
				} else if (phenotype_accession_array.includes(res[i]['GRIN_Accession'])) {
					var accession = res[i]['GRIN_Accession'];
					var position = res[i]['Position'];
					var category_index = res[i]['Category_Index'];
					if (!(accession in genotype_dict)) {
						genotype_dict[accession] = {};
					}
					if (!(position in genotype_dict[accession])) {
						genotype_dict[accession][position] = category_index;
					}
				}
			}

			// Deduplicate phenotype dictionary and genotype dictionary
			var pheno_geno_dict = deduplicatePhenotypeDictAndGenotypeDict(phenotype_dict, genotype_dict);
			phenotype_dict = pheno_geno_dict['Phenotype'];
			genotype_dict = pheno_geno_dict['Genotype'];

			// Perform MADis algorithm here
			var madis_result = runMADisAlgorithm(phenotype_dict, genotype_dict);

			// Display MADis results
			if (madis_result.length > 0) {
				document.getElementById('madis_result_'+gene).innerHTML = "";
				let download_button = document.createElement("button");
				download_button.innerHTML = "Download";
				download_button.addEventListener('click', function(){
					downloadMADisResults(dataset, gene, phenotype_dict);
				});
				document.getElementById('madis_result_'+gene).appendChild(download_button);
				document.getElementById('madis_result_'+gene).appendChild(document.createElement("br"));
				document.getElementById('madis_result_'+gene).appendChild(document.createElement("br"));
				document.getElementById('madis_result_'+gene).appendChild(
					constructTable(madis_result)
				);
				document.getElementById('madis_result_'+gene).style.overflow = 'scroll';
			} else {
				let error_message = document.createElement("p");
				error_message.innerHTML = "Unable to construct table!!!";
				document.getElementById('madis_result_'+gene).appendChild(error_message);
				document.getElementById('madis_result_'+gene).style.overflow = 'visible';
			}
		},
		error: function (xhr, status, error) {
			console.log('Error with code ' + xhr.status + ': ' + xhr.statusText);
		}
	});
}


function updateAllMADisResults(dataset, gene_array, phenotype_dict){
	for (let i = 0; i < gene_array.length; i++) {
		updateMADisResults(dataset, gene_array[i], phenotype_dict)
	}
}

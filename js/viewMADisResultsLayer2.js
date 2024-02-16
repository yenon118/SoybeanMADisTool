
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
	let dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
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


// Query the genotype data of specific accessions. This is used to create metadata for the MADis result table.
async function queryGenotypeDataOfSpecificAccessions(dataset, gene, position_array, accession_array) {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: './php/queryGenotypeDataOfSpecificAccessions.php',
			type: 'GET',
			contentType: 'application/json',
			data: {
				Dataset: dataset,
				Gene: gene,
				Positions: position_array,
				Accessions: accession_array
			},
			success: function (response) {
				var res = JSON.parse(response);
				res = res.data;

				resolve(res);
			}, error: function (xhr, status, error) {
				console.log('Error with code ' + xhr.status + ': ' + xhr.statusText);
				reject([]);
			}
		});
	});
}


function constructPhenotypeSummaryTable(dataset, gene, jsonObject, phenotype_dict) {
	// Create N_total, N_WT, N_MUT table
	var detail_table = document.createElement("table");
	detail_table.setAttribute("style", "text-align:center; border:3px solid #000;");

	var detail_header_tr = document.createElement("tr");
	var header_array = ["N_total", "N_WT", "N_MUT"];

	// Loop through the header array to create table header
	for (let i = 0; i < header_array.length; i++) {
		var detail_th = document.createElement("th");
		detail_th.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
		detail_th.innerHTML = header_array[i];
		detail_header_tr.appendChild(detail_th);
	}
	detail_table.appendChild(detail_header_tr);

	for (let i = 0; i < 1; i++) {
		var detail_content_tr = document.createElement("tr");

		// Loop through the header array to create table content
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


function constructMetadataTable(dataset, gene, jsonObject, phenotype_dict) {

	// Create table
	let detail_table = document.createElement("table");
	detail_table.setAttribute("style", "text-align:center; border:3px solid #000;");

	let detail_header_tr = document.createElement("tr");
	let header_array = ["Gene", "Chromosome", "Position", "Accession", "SoyKB_Accession", "GRIN_Accession", "Genotype", "Category", "Phenotype"];

	for (let i = 0; i < header_array.length; i++) {
		var detail_th = document.createElement("th");
		detail_th.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
		detail_th.innerHTML = header_array[i];
		detail_header_tr.appendChild(detail_th);
	}
	detail_table.appendChild(detail_header_tr);

	for (let i = 0; i < jsonObject.length; i++) {
		var detail_content_tr = document.createElement("tr");
		detail_content_tr.style.backgroundColor = ((i % 2) ? "#FFFFFF" : "#DDFFDD");

		// Loop through the header array to create table content
		for (let j = 0; j < header_array.length; j++) {
			if (header_array[j] != "Phenotype") {
				var detail_td = document.createElement("td");
				detail_td.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
				detail_td.innerHTML = jsonObject[i][header_array[j]];
				detail_content_tr.appendChild(detail_td);
			} else {
				// Extract the phenotype value from the phenotype dictionary
				let phenotype_value = "";
				if (Object.keys(phenotype_dict).includes(jsonObject[i]["Accession"])) {
					phenotype_value = phenotype_dict[jsonObject[i]["Accession"]];
				} else if (Object.keys(phenotype_dict).includes(jsonObject[i]["SoyKB_Accession"])) {
					phenotype_value = phenotype_dict[jsonObject[i]["SoyKB_Accession"]];
				} else if (Object.keys(phenotype_dict).includes(jsonObject[i]["GRIN_Accession"])) {
					phenotype_value = phenotype_dict[jsonObject[i]["GRIN_Accession"]];
				}

				// Convert the phenotype value to WT or MUT
				if (phenotype_value != "") {
					if (parseInt(phenotype_value) == 0) {
						phenotype_value = "WT";
					} else if (parseInt(phenotype_value) == 1) {
						phenotype_value = "MUT";
					}
				}

				// Build the table cell
				var detail_td = document.createElement("td");
				detail_td.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
				detail_td.innerHTML = phenotype_value;
				detail_content_tr.appendChild(detail_td);
			}
		}
		detail_table.appendChild(detail_content_tr);
	}

	return (detail_table);
}


function constructTable(dataset, gene, jsonObject, phenotype_dict) {

	// Create table
	let detail_table = document.createElement("table");
	detail_table.setAttribute("style", "text-align:center; border:3px solid #000;");

	let detail_header_tr = document.createElement("tr");
	let header_array = Object.keys(jsonObject[0]);

	// Loop through the header array to create table header
	for (let i = 0; i < header_array.length; i++) {
		if (!header_array[i].startsWith('Accessions_of') && header_array[i] != "N_total" && header_array[i] != "N_WT" && header_array[i] != "N_MUT") {
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
	}
	detail_table.appendChild(detail_header_tr);

	for (let i = 0; i < jsonObject.length; i++) {
		var detail_content_tr = document.createElement("tr");
		detail_content_tr.style.backgroundColor = ((i % 2) ? "#FFFFFF" : "#DDFFDD");

		// Loop through the header array to create table content
		for (let j = 0; j < header_array.length; j++) {
			// All position combinations in the Combination_of_positions column need to link to Allele Catalog
			if (!header_array[j].startsWith('Accessions_of') && header_array[j] != "N_total" && header_array[j] != "N_WT" && header_array[j] != "N_MUT") {
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
				} else if (header_array[j] == "N_WT_match" || header_array[j] == "N_WT_unmatch" || header_array[j] == "N_MUT_match" || header_array[j] == "N_MUT_unmatch" || header_array[j] == "N_unexplained") {
					// If accession count is not 0, we put a link to the number. Otherwise, we just put the number.
					if (parseInt(jsonObject[i][header_array[j]]) > 0) {
						var detail_td = document.createElement("td");
						detail_td.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
						var detail_a = document.createElement('a');
						detail_a.id = String(gene) + "_" + header_array[j] + "_" + i;
						detail_a.href = "javascript:void(0);";
						detail_a.addEventListener('click', async function () {
							// Get the accessions related header key from the header array
							let accessions_related_header_key = header_array[j].replace(/^N_/, 'Accessions_of_');

							// Get the accession array and position array
							let accession_array = jsonObject[i][accessions_related_header_key];
							let position_array = jsonObject[i]["Combination_of_positions"];

							var result_array = await queryGenotypeDataOfSpecificAccessions(dataset, gene, position_array, accession_array);

							// Open modal
							document.getElementById("info-modal").style.display = "block";

							// Construct metadata table
							var metadata_table = constructMetadataTable(dataset, gene, result_array, phenotype_dict);

							document.getElementById('modal-content-div').appendChild(metadata_table);

							var p_metadata_length = document.createElement("p");
							p_metadata_length.innerHTML = "Total number of records: " + result_array.length;

							document.getElementById("modal-content-comment").appendChild(p_metadata_length);
						});
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
				} else {
					var detail_td = document.createElement("td");
					detail_td.setAttribute("style", "border:1px solid black; min-width:80px; height:18.5px;");
					detail_td.innerHTML = jsonObject[i][header_array[j]];
					detail_content_tr.appendChild(detail_td);
				}
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
			madis_result = filterMADisResult(madis_result);

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

				// Create phenotype summary table
				document.getElementById('madis_result_' + gene).appendChild(
					constructPhenotypeSummaryTable(dataset, gene, madis_result, phenotype_dict)
				);

				// Empty line
				document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));

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

				if (madis_result.length == 50000) {
					// Warning message
					let warning_message = document.createElement("p");
					warning_message.innerHTML = "Warning: The number of combinations is too large. Only the first 50000 combinations are processed. Please check less checkboxes to reduce the number of positions.";
					warning_message.style.color = "red";
					document.getElementById('madis_result_' + gene).appendChild(warning_message);

					// Empty lines
					document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));
					document.getElementById('madis_result_' + gene).appendChild(document.createElement("br"));
				}

				// Display MADis results in a table
				document.getElementById('madis_result_' + gene).appendChild(
					constructTable(dataset, gene, madis_result, phenotype_dict)
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

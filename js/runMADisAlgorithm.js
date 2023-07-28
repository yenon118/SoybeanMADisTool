
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

// filter MADis Results
function filterMADisResult(res_dict_array) {
	var new_res_dict_array = new Array(res_dict_array.length);

	for (let i = 0; i < res_dict_array.length; i++) {
		var res_dict = res_dict_array[i];
		var chromosome = res_dict['Chromosome'];
		var combination_of_positions = res_dict['Combination_of_positions'];
		var n_positions = res_dict['N_positions'];
		var score = res_dict['Score'];
		var n_total = res_dict['N_total'];
		var n_WT = res_dict['N_WT'];
		var n_WT_match = res_dict['N_WT_match'];
		var accessions_of_WT_match = res_dict['Accessions_of_WT_match'];
		var n_WT_unmatch = res_dict['N_WT_unmatch'];
		var accessions_of_WT_unmatch = res_dict['Accessions_of_WT_unmatch'];
		var n_MUT = res_dict['N_MUT'];
		var n_MUT_match = res_dict['N_MUT_match'];
		var accessions_of_MUT_match = res_dict['Accessions_of_MUT_match'];
		var n_MUT_unmatch = res_dict['N_MUT_unmatch'];
		var accessions_of_MUT_unmatch = res_dict['Accessions_of_MUT_unmatch'];
		var phenotype_explain_percentage = res_dict['Phenotype_explain_percentage'];
		var n_unexplained = res_dict['N_unexplained'];
		var accessions_of_unexplained = res_dict['Accessions_of_unexplained'];

		var new_res_dict = {
			'Chromosome': chromosome,
			'Combination_of_positions': combination_of_positions,
			'N_positions': n_positions,
			'Score': score,
			'N_total': n_total,
			'N_WT': n_WT,
			'N_WT_match': n_WT_match,
			'N_WT_unmatch': n_WT_unmatch,
			'N_MUT': n_MUT,
			'N_MUT_match': n_MUT_match,
			'N_MUT_unmatch': n_MUT_unmatch,
			'Phenotype_explain_percentage': phenotype_explain_percentage,
			'N_unexplained': n_unexplained
		};

		new_res_dict_array[i] = new_res_dict;
	}

	return (new_res_dict_array);
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
	// Currently, we are limiting the number of combinations to 50000
	if (combs.length > 50000) {
		combs = combs.slice(0, 50000);
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
			'Accessions_of_WT_match': [],
			'N_WT_unmatch': 0,
			'Accessions_of_WT_unmatch': [],
			'N_MUT': n_mut_p,
			'N_MUT_match': 0,
			'Accessions_of_MUT_match': [],
			'N_MUT_unmatch': 0,
			'Accessions_of_MUT_unmatch': [],
			'Phenotype_explain_percentage': 0,
			'N_unexplained': 0,
			'Accessions_of_unexplained': [],
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

			// Get the remainder of the sum (non mutation will be 0 as total combination is less than 10)
			geno_sum[accession] = geno_sum[accession] % 10

			// Calculate the score
			if (geno_sum[accession] == parseInt(phenotype_dict[accession])) {
				res_dict['Score'] = res_dict['Score'] + 1;
				if (parseInt(phenotype_dict[accession]) == 1) {
					res_dict['N_MUT_match'] = res_dict['N_MUT_match'] + 1;
					res_dict['Accessions_of_MUT_match'].push(accession);
				} else {
					res_dict['N_WT_match'] = res_dict['N_WT_match'] + 1;
					res_dict['Accessions_of_WT_match'].push(accession);
				}
			} else {
				res_dict['N_unexplained'] = res_dict['N_unexplained'] + 1;
				res_dict['Accessions_of_unexplained'].push(accession);
				if (parseInt(phenotype_dict[accession]) == 1) {
					res_dict['N_MUT_unmatch'] = res_dict['N_MUT_unmatch'] + 1;
					res_dict['Accessions_of_MUT_unmatch'].push(accession);
				} else {
					res_dict['N_WT_unmatch'] = res_dict['N_WT_unmatch'] + 1;
					res_dict['Accessions_of_WT_unmatch'].push(accession);
				}
				res_dict['Score'] = res_dict['Score'] + d_score[String(geno_sum[accession]) + String(phenotype_dict[accession])]
			}
		}

		res_dict['Phenotype_explain_percentage'] = parseFloat(100 * (res_dict['N_MUT_match'] + res_dict['N_WT_match']) / res_dict['N_total']).toFixed(2);

		res_dict_array.push(res_dict);
	}

	res_dict_array.sort((a, b) => (a.Phenotype_explain_percentage < b.Phenotype_explain_percentage) ? 1 : -1);

	return (res_dict_array);
}

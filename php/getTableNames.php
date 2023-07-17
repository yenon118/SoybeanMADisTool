<?php

function getTableNames($dataset){

	// Table names and datasets
	if ($dataset == "Soy775") {
		$gff_table = "mad_Soybean_Wm82a2v1_GFF";
		$accession_mapping_table = "mad_Soy775_Accession_Mapping";
	} elseif ($dataset == "Soy1066") {
		$gff_table = "mad_Soybean_Wm82a2v1_GFF";
		$accession_mapping_table = "mad_Soy1066_Accession_Mapping";
	} else {
		$key_column = "";
		$gff_table = "";
		$accession_mapping_table = $dataset;
	}

	return array(
		"gff_table" => $gff_table,
		"accession_mapping_table" => $accession_mapping_table
	);
}

?>
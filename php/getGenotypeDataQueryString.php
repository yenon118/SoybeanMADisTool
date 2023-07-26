<?php

function getGenotypeDataQueryString($dataset, $gene, $chromosome, $db, $gff_table, $accession_mapping_table, $having = ""){

	// Generate SQL string
	$query_str = "SELECT ";
	$query_str = $query_str . "GENO.Chromosome, GENO.Position, GENO.Accession, AM.SoyKB_Accession, AM.GRIN_Accession, ";
	$query_str = $query_str . "GENO.Genotype, GENO.Category, GENO.Category_Index, GENO.Imputation, COMB1.Gene ";
	$query_str = $query_str . "FROM ( ";
	$query_str = $query_str . "     SELECT DISTINCT FUNC.Chromosome, FUNC.Position, GFF.Name AS Gene ";
	$query_str = $query_str . "     FROM " . $db . "." . $gff_table . " AS GFF ";
	$query_str = $query_str . "     INNER JOIN " . $db . ".mad_" . $dataset . "_func_eff_" . $chromosome . " AS FUNC ";
	$query_str = $query_str . "     ON (FUNC.Chromosome = GFF.Chromosome) AND (FUNC.Position >= GFF.Start) AND (FUNC.Position <= GFF.End) ";
	$query_str = $query_str . "     WHERE (GFF.Name = '" . $gene . "') AND (FUNC.Gene_Name LIKE '%" . $gene . "%') ";
	$query_str = $query_str . ") AS COMB1 ";
	$query_str = $query_str . "INNER JOIN " . $db . ".mad_" . $dataset . "_genotype_" . $chromosome . " AS GENO ";
	$query_str = $query_str . "ON (GENO.Chromosome = COMB1.Chromosome) AND (GENO.Position = COMB1.Position) ";
	$query_str = $query_str . "LEFT JOIN " . $db . "." . $accession_mapping_table . " AS AM ";
	$query_str = $query_str . "ON (AM.Accession = GENO.Accession) ";
	$query_str = $query_str . $having . " ";
	$query_str = $query_str . "ORDER BY GENO.Chromosome, GENO.Position, GENO.Accession DESC; ";

	return $query_str;
}

?>
<?php

include '../../config.php';
include 'pdoResultFilter.php';
include 'getTableNames.php';
include 'getGenotypeDataQueryString.php';

$dataset = trim($_GET['Dataset']);
$gene = $_GET['Gene'];

$db = "soykb";

// Table names and datasets
$table_names = getTableNames($dataset);
$gff_table = $table_names["gff_table"];
$accession_mapping_table = $table_names["accession_mapping_table"];

// Generate SQL string
$query_str = "SELECT Chromosome, Start, End, Name AS Gene ";
$query_str = $query_str . "FROM " . $db . "." . $gff_table . " ";
$query_str = $query_str . "WHERE Name='" . $gene . "';";

$stmt = $PDO->prepare($query_str);
$stmt->execute();
$result = $stmt->fetchAll();

$gene_result_arr = pdoResultFilter($result);

// Get gene information
$chromosome = $gene_result_arr[0]["Chromosome"];
$start = $gene_result_arr[0]["Start"];
$end = $gene_result_arr[0]["End"];


// Generate query string
$query_str = getGenotypeDataQueryString(
	$dataset,
	$gene,
	$chromosome,
	$db,
	$gff_table,
	$accession_mapping_table,
	""
);

$stmt = $PDO->prepare($query_str);
$stmt->execute();
$result = $stmt->fetchAll();

$result_arr = pdoResultFilter($result);

echo json_encode(array("data" => $result_arr), JSON_INVALID_UTF8_IGNORE);

?>
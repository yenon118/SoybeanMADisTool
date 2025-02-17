<?php

include '../../config.php';
include 'pdoResultFilter.php';
include 'getTableNames.php';
include 'getGenotypeDataQueryString.php';

$dataset = trim($_GET['Dataset']);
$gene = $_GET['Gene'];
$positions = $_GET['Positions'];


$dataset = clean_malicious_input($dataset);
$dataset = preg_replace('/\s+/', '', $dataset);

$gene = clean_malicious_input($gene);
$gene = preg_replace('/\s+/', '', $gene);


if (empty($positions)) {
	$position_array = array();
} elseif (is_string($positions)) {
	$positions = trim($positions);
	$temp_position_array = preg_split("/[;, \n]+/", $positions);
	$position_array = array();
	for ($i = 0; $i < count($temp_position_array); $i++) {
		if (!empty(preg_replace("/[^0-9.]/", "", $temp_position_array[$i]))) {
			array_push($position_array, preg_replace("/[^0-9.]/", "", $temp_position_array[$i]));
		}
	}
} elseif (is_array($positions)) {
	$temp_position_array = $positions;
	$position_array = array();
	for ($i = 0; $i < count($temp_position_array); $i++) {
		if (!empty(preg_replace("/[^0-9.]/", "", $temp_position_array[$i]))) {
			array_push($position_array, preg_replace("/[^0-9.]/", "", $temp_position_array[$i]));
		}
	}
}

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
	$position_array,
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

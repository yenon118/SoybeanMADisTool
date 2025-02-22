<?php

include '../../config.php';
include 'pdoResultFilter.php';
include 'getTableNames.php';
include 'getSummarizedDataByChromosomePositionsQueryString.php';
include 'getDataByChromosomePositionsQueryString.php';

$dataset = trim($_GET['Dataset']);
$gene = $_GET['Gene'];
$chromosome = $_GET['Chromosome'];
$positions = $_GET['Positions'];


$dataset = clean_malicious_input($dataset);
$dataset = preg_replace('/\s+/', '', $dataset);

$gene = clean_malicious_input($gene);
$gene = preg_replace('/\s+/', '', $gene);

$chromosome = clean_malicious_input($chromosome);
$chromosome = preg_replace('/\s+/', '', $chromosome);


if (is_string($positions)) {
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
$key_column = $table_names["key_column"];
$gff_table = $table_names["gff_table"];
$accession_mapping_table = $table_names["accession_mapping_table"];

// Generate query string
$query_str = getDataByChromosomePositionsQueryString(
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

for ($i = 0; $i < count($result_arr); $i++) {
	if (preg_match("/\+/i", $result_arr[$i]["Imputation"])) {
		$result_arr[$i]["Imputation"] = "+";
	} else {
		$result_arr[$i]["Imputation"] = "";
	}
}

echo json_encode(array("data" => $result_arr), JSON_INVALID_UTF8_IGNORE);

?>

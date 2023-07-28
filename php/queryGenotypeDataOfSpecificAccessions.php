<?php

include '../../config.php';
include 'pdoResultFilter.php';
include 'getTableNames.php';
include 'getGenotypeDataQueryString.php';

$dataset = trim($_GET['Dataset']);
$gene = $_GET['Gene'];
$positions = $_GET['Positions'];
$accessions = $_GET['Accessions'];

if (empty($positions)) {
	$position_array = array();
} elseif (is_string($positions)) {
	$position_array = preg_split("/[;, \n]+/", $positions);
	for ($i = 0; $i < count($position_array); $i++) {
		$position_array[$i] = trim($position_array[$i]);
	}
} elseif (is_array($positions)) {
	$position_array = $positions;
	for ($i = 0; $i < count($position_array); $i++) {
		$position_array[$i] = trim($position_array[$i]);
	}
}

if (empty($accessions)) {
	$accession_array = array();
} elseif (is_string($accessions)) {
	$accession_array = preg_split("/[;, \n]+/", $accessions);
	for ($i = 0; $i < count($accession_array); $i++) {
		$accession_array[$i] = trim($accession_array[$i]);
	}
} elseif (is_array($accessions)) {
	$accession_array = $accessions;
	for ($i = 0; $i < count($accession_array); $i++) {
		$accession_array[$i] = trim($accession_array[$i]);
	}
}

if (empty($accession_array)) {
    $where = "";
} else {
    if (is_array($accession_array)) {
		$where = $where . "WHERE (GENO.Accession IN ('";
		for ($i = 0; $i < count($accession_array); $i++) {
			if($i < (count($accession_array)-1)){
				$where = $where . trim($accession_array[$i]) . "', '";
			} elseif ($i == (count($accession_array)-1)) {
				$where = $where . trim($accession_array[$i]);
			}
		}
		$where = $where . "')) ";
		$where = $where . "OR (AM.SoyKB_Accession IN ('";
		for ($i = 0; $i < count($accession_array); $i++) {
			if($i < (count($accession_array)-1)){
				$where = $where . trim($accession_array[$i]) . "', '";
			} elseif ($i == (count($accession_array)-1)) {
				$where = $where . trim($accession_array[$i]);
			}
		}
		$where = $where . "')) ";
		$where = $where . "OR (AM.GRIN_Accession IN ('";
		for ($i = 0; $i < count($accession_array); $i++) {
			if($i < (count($accession_array)-1)){
				$where = $where . trim($accession_array[$i]) . "', '";
			} elseif ($i == (count($accession_array)-1)) {
				$where = $where . trim($accession_array[$i]);
			}
		}
		$where = $where . "')) ";
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
	$where
);

$stmt = $PDO->prepare($query_str);
$stmt->execute();
$result = $stmt->fetchAll();

$result_arr = pdoResultFilter($result);

echo json_encode(array("data" => $result_arr), JSON_INVALID_UTF8_IGNORE);

?>
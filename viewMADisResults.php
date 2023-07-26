<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css"></link>
<script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
<script src="https://code.jquery.com/ui/1.13.1/jquery-ui.js"></script>
<style>
	.ui-accordion-header.ui-state-active {
		background-color: green;
	}
</style>
<script>
	$(function() {
		$("#accordion").accordion({
			active: false,
			collapsible: true,
			heightStyle: 'panel'
		});
	});
</script>

<?php
$TITLE = "Soybean Allele Catalog Tool";

// include '../header.php';
include '../config.php';
include './php/pdoResultFilter.php';
?>

<!-- Back button -->
<a href="/SoybeanMADisTool/"><button> &lt; Back </button></a>

<br />
<br />

<!-- Get and process the variables -->
<?php
$dataset = $_POST['dataset_1'];
$gene = $_POST['gene_1'];
$max_combination = intval($_POST['max_combination_1']);
$file_name = $_FILES['file_1']['name'];
$file_type = $_FILES['file_1']['type'];
$file_tmp_name = $_FILES['file_1']['tmp_name'];
$file_error = $_FILES['file_1']['error'];
$file_size = $_FILES['file_1']['size'];

if ($max_combination > 7) {
	$max_combination = 7;
} elseif ($max_combination < 2) {
	$max_combination = 2;
}

if (is_string($gene)) {
	$gene_array = preg_split("/[;, \n]+/", $gene);
	for ($i = 0; $i < count($gene_array); $i++) {
		$gene_array[$i] = trim($gene_array[$i]);
	}
} elseif (is_array($gene)) {
	$gene_array = $gene;
	for ($i = 0; $i < count($gene_array); $i++) {
		$gene_array[$i] = trim($gene_array[$i]);
	}
}

$db = "soykb";

$dataset = trim($dataset);
?>


<!-- Read phenotype data -->
<?php
$phenotype_array = array();

if (file_exists($file_tmp_name)) {
	try {
		$phenotype_file = fopen($file_tmp_name, "r") or die("Unable to open phenotype file!");
		// Output one line until end-of-file
		while(!feof($phenotype_file)) {
			array_push($phenotype_array, fgets($phenotype_file));
		}
		fclose($phenotype_file);
	} catch (Exception $e) {
		echo "Unable to open phenotype file!!!";
		echo 'Caught exception: ',  $e->getMessage(), "\n";
	}
} else {
	echo "Phenotype file does not exists!!!";
}
?>


<?php

echo "<h4>Dataset: " . $dataset . "</h4>";

echo "<div id=\"accordion\">";

for ($i = 0; $i < count($gene_array); $i++) {
	echo "<h3>" . $gene_array[$i] . "</h3>";
	echo "<div id=\"madis_result_" . $gene_array[$i] . "\" name=\"madis_result_" . $gene_array[$i] . "\">";
	echo "</div>";
}

echo "</div>";
echo "<br/><br/>";
?>

<script type="text/javascript" language="javascript" src="./js/viewMADisResults.js"></script>

<script type="text/javascript" language="javascript">

	var dataset = <?php if(isset($dataset)) {echo json_encode($dataset, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var gene_array = <?php if(isset($gene_array)) {echo json_encode($gene_array, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var max_combination = <?php if(isset($max_combination)) {echo json_encode($max_combination, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var phenotype_array = <?php if(isset($phenotype_array)) {echo json_encode($phenotype_array, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;

	var phenotype_dict = processPhenotypeArray(phenotype_array);
	updateAllMADisResults(dataset, gene_array, phenotype_dict, max_combination);
</script>

<?php include '../footer.php'; ?>

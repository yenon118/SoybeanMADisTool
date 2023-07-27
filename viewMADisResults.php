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
$TITLE = "Soybean MADis Tool";

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
$max_combination = $_POST['max_combination_1'];
$file_name = $_FILES['file_1']['name'];
$file_type = $_FILES['file_1']['type'];
$file_tmp_name = $_FILES['file_1']['tmp_name'];
$file_error = $_FILES['file_1']['error'];
$file_size = $_FILES['file_1']['size'];

// Copy the uploaded file to the uploads folder
$phenotype_file_moved_flag = false;
if (!empty($file_tmp_name)) {
	$phenotype_file_name = preg_replace('/.*\//i', '', $file_tmp_name) . '_' . $file_name;
	$phenotype_file = './uploads/tmp_phenotype_files/' . $phenotype_file_name;
	$phenotype_file_moved_flag = move_uploaded_file($file_tmp_name, $phenotype_file);
}

// Check max_combination value is reasonable
if (empty($max_combination)) {
	$max_combination = 2;
} else {
	$max_combination = intval($max_combination);
	if ($max_combination > 7) {
		$max_combination = 7;
	} elseif ($max_combination < 2) {
		$max_combination = 2;
	}
}

// Parse the gene string
if (empty($gene)) {
	$gene_array = array();
} elseif (is_string($gene)) {
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

if (!empty($phenotype_file)) {
	if (file_exists($phenotype_file)) {
		try {
			$phenotype_reader = fopen($phenotype_file, "r") or die("Unable to open phenotype file!");
			// Output one line until end-of-file
			while(!feof($phenotype_reader)) {
				array_push($phenotype_array, fgets($phenotype_reader));
			}
			fclose($phenotype_reader);
		} catch (Exception $e) {
			echo "Unable to open phenotype file!!!";
			echo 'Caught exception: ',  $e->getMessage(), "\n";
		}
	} else {
		echo "Phenotype file does not exists!!! <br />";
	}
}

?>


<!-- Populate the div tag or accordion with div tags to get ready to receive results -->
<?php
echo "<p>Result for a combination of 2 variant positions. To check the contribution of other variant positions, please select additional combinations and press \"Compute with MADis Algorithm for Selected  Positions\".</p>";

echo "<h4>Dataset: " . $dataset . "</h4>";

if (count($gene_array) > 1) {
	echo "<div id=\"accordion\">";
	for ($i = 0; $i < count($gene_array); $i++) {
		echo "<h3>Gene: " . $gene_array[$i] . "</h3>";
		echo "<div id=\"madis_result_" . $gene_array[$i] . "\" name=\"madis_result_" . $gene_array[$i] . "\">";
		echo "</div>";
	}
	echo "</div>";
	echo "<br/><br/>";
} elseif (count($gene_array) == 1) {
	echo "<h4>Gene: " . $gene_array[0] . "</h4>";
	echo "<div id=\"madis_result_" . $gene_array[0] . "\" name=\"madis_result_" . $gene_array[0] . "\">";
	echo "</div>";
	echo "<br/><br/>";
} else {
	echo "No gene is provided!!! <br />";
}
?>


<script type="text/javascript" language="javascript" src="./js/runMADisAlgorithm.js"></script>
<script type="text/javascript" language="javascript" src="./js/viewMADisResults.js"></script>

<script type="text/javascript" language="javascript">
	var dataset = <?php if(isset($dataset)) {echo json_encode($dataset, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var gene_array = <?php if(isset($gene_array)) {echo json_encode($gene_array, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var max_combination = <?php if(isset($max_combination)) {echo json_encode($max_combination, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var phenotype_file_name = <?php if(isset($phenotype_file_name)) {echo json_encode($phenotype_file_name, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var phenotype_array = <?php if(isset($phenotype_array)) {echo json_encode($phenotype_array, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;

	var phenotype_dict = processPhenotypeArray(phenotype_array);
	updateAllMADisResults(dataset, gene_array, phenotype_dict, max_combination);
</script>


<?php include '../footer.php'; ?>

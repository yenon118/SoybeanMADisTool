<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css"></link>
<script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
<script src="https://code.jquery.com/ui/1.13.1/jquery-ui.js"></script>

<?php
$TITLE = "Soybean MADis Tool";

// include '../header.php';
include '../config.php';
include './php/pdoResultFilter.php';
?>

<link rel="stylesheet" href="css/modal.css" />

<!-- Back button -->
<a href="/SoybeanMADisTool/"><button> &lt; Back </button></a>

<br />
<br />

<!-- Modal -->
<div id="info-modal" class="info-modal">
	<!-- Modal content -->
	<div class="modal-content">
		<span class="modal-close">&times;</span>
		<div id="modal-content-div" style='width:100%; height:auto; border:3px solid #000; overflow:scroll;max-height:1000px;'></div>
		<div id="modal-content-comment"></div>
	</div>
</div>

<!-- Get and process the variables -->
<?php
$dataset = $_GET['dataset'];
$gene = $_GET['gene'];
$positions = $_GET['positions'];
$phenotype_file_name = $_GET['phenotype_file_name'];

$max_combination = 7;

// Re-create the path of the phenotype file
$phenotype_file = './uploads/tmp_phenotype_files/' . $phenotype_file_name;

$db = "soykb";

$dataset = trim($dataset);
$gene = trim($gene);

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
		echo "Phenotype file does not exists!!!";
	}
}
?>


<?php
echo "<p>Combinations of a maximum of 7 variant positions are computed and displayed.</p>";

echo "<h4>Dataset: " . $dataset . "</h4>";
echo "<h4>Gene: " . $gene . "</h4>";
echo "<h4>Variant positions selected for computing: " . implode(", ", $position_array) . "</h4>";

echo "<div id=\"madis_result_" . $gene . "\" name=\"madis_result_" . $gene . "\">";
echo "</div>";

echo "<br/><br/>";
?>


<script type="text/javascript" language="javascript" src="./js/modal.js"></script>
<script type="text/javascript" language="javascript" src="./js/runMADisAlgorithm.js"></script>
<script type="text/javascript" language="javascript" src="./js/viewMADisResultsLayer2.js"></script>

<script type="text/javascript" language="javascript">
	var dataset = <?php if(isset($dataset)) {echo json_encode($dataset, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var gene = <?php if(isset($gene)) {echo json_encode($gene, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var position_array = <?php if(isset($position_array)) {echo json_encode($position_array, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var max_combination = <?php if(isset($max_combination)) {echo json_encode($max_combination, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var phenotype_file_name = <?php if(isset($phenotype_file_name)) {echo json_encode($phenotype_file_name, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;
	var phenotype_array = <?php if(isset($phenotype_array)) {echo json_encode($phenotype_array, JSON_INVALID_UTF8_IGNORE);} else {echo "";}?>;

	var phenotype_dict = processPhenotypeArray(phenotype_array);
	document.getElementById('madis_result_' + gene).innerHTML = "Loading...";
	updateMADisResults(dataset, gene, position_array, phenotype_dict, max_combination);
</script>


<?php include '../footer.php'; ?>

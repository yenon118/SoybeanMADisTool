<?php

include '../../config.php';

$result_arr = array();

$file_path = "../assets/Hilum_col_BlXBr_Soy1066_pheno_template.txt";

if (file_exists($file_path)) {
	try {
		$example_data_file = fopen($file_path, "r") or die("Unable to open example data file!");
		// Output one line until end-of-file
		while (!feof($example_data_file)) {
			array_push($result_arr, fgets($example_data_file));
		}
		fclose($example_data_file);
	} catch (Exception $e) {
		echo "Unable to open example data file!!!";
		echo 'Caught exception: ',  $e->getMessage(), "\n";
	}
} else {
	echo "Example data file does not exists!!!";
}

echo json_encode(array("data" => $result_arr), JSON_INVALID_UTF8_IGNORE);

?>

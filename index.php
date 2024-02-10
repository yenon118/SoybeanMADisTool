<script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>

<?php
$TITLE = "Soybean MADis Tool";

include '../header.php';
?>

<p style="margin-left: 20px; font-size: 120%;"><b>The Soybean MADis Tool is a mutative allele discovery tool composed of mutative allele position combinative calculations.</b></p>

<div>
	<table width="100%" cellspacing="14" cellpadding="14">
		<tr>
			<td width="50%" align="center" valign="top" style="border:1px solid #999999; padding:10px; background-color:#f8f8f8; text-align:left;">
				<form action="viewMADisResults.php" method="post" enctype='multipart/form-data' target="_blank">
					<h2></h2>
					<br />
					<label for="dataset_1"><b>Dataset:</b></label>
					<select name="dataset_1" id="dataset_1" onchange="updateExampleGeneIDs(event)">
						<option value="Soy775">Soy775</option>
						<option value="Soy1066" selected>Soy1066</option>
					</select>
					<br />
					<br />
					<label><b>Gene IDs:</b></label>
					<span id="gene_examples_1" style="font-size:9pt">&nbsp;(eg Glyma.01G049100 Glyma.01G049200 Glyma.01G049300)</span>
					<br />
					<textarea id="gene_1" name="gene_1" rows="8" cols="100" placeholder="&#10;Please separate each gene into a new line. &#10;&#10;Example:&#10;Glyma.01G049100&#10;Glyma.01G049200&#10;Glyma.01G049300"></textarea>
					<br />
					<br />
					<label><b>Phenotype Data Upload:</b></label>
					<span id="phenotype_data_hint_1" style="font-size:9pt">&nbsp;(tab delimited txt or comma separated csv only)</span>
					<button type="button" style="min-width: 100px;" onclick="downloadExampleData()">Example Data</button>
					<br />
					<input type="file" id="file_1" name="file_1" accept="text/csv, text/plain">
					<br />
					<br />
					<!-- <label><b>Maximum combination:</b></label> -->
					<!-- <span id="max_combination_hint_1" style="font-size:9pt">&nbsp;(accept any number between 2 and 7 inclusive; default: 2)</span> -->
					<!-- <br /> -->
					<!-- <input type="number" id="max_combination_1" name="max_combination_1"> -->
					<br />
					<br />
					<span style="font-size:9pt">* MADis computation starts with 2 variant positions</span>
					<input style="float: right; clear: both; min-width: 260px;" type="submit" value="Search">
				</form>
			</td>
		</tr>
	</table>
</div>

<br />
<br />

<div style='margin-top:10px;' align='center'>
	<button onclick="queryAccessionInformation()" style="min-width:250px;background-color:#FFFFFF;">Download Accession Information</button>
	<button onclick="downloadGuidelines()" style="margin-right:20px;min-width:200px;background-color:#DDFFDD;">Download Guidelines</button>
</div>

<br />
<br />


<script type="text/javascript" language="javascript" src="./js/index.js"></script>

<script type="text/javascript" language="javascript">
</script>

<?php include '../footer.php'; ?>

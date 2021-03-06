# SaveData.js

## Simple Data Export for Javascript

SaveData.js is a browser Javascript library for saving datasets for easy export to R, Python, SAS, etc. It has no dependencies.

## Including in a browser

Download [SaveData.js](https://github.com/MatthewYurdin/SaveData/edit/master/SaveData.js) and include it in a `script` tag:

```html
<script type='text/javascript' src='SaveData.js'></script>
<script type='text/javascript'>
SaveData.toFile(myDataset, "R");
</script>
```

## Usage

There are two data export methods: `toFile(dataset, format)` & `toLog(dataset, format)`.

A helper function, `standardizeStructure(dataset)`, is also sometimes handy, so that is exposed as well. Its use it described below.

### SaveData.toFile(dataset, format)
```js
SaveData.toFile(myData); // Saves output as CSV
SaveData.toFile(myData, "json"); // Saves output as JSON
SaveData.toFile(myData, "csv"); //Saves output as CSV
SaveData.toFile(myData, {"format": "csv"); //Saves as CSV
// Saves output as "my-family-data.txt" using "!" to separate values
SaveData.toFile(myData, {"format": "delimited", "delimiter": "!", "filename": "my-family-data");
SaveData.toFile(myData, {"format": "python"); // Saves output as a Python script
// Saves output as an R script creating a dataframe named "myDataframe"
SaveData.toFile(myData, {"format": "R", "name": "myDataframe");
// Saves output as a js script creating an object called "myDataObj"
SaveData.toFile(myData, {"format": "js", "name": "myDataObj");
```

The only required parameter is `dataset`.

## Input Data

If the intended output format is JSON or JS, there are no limitations as far as the structure of the input dataset. If the desired output is R, Python, a CSV or other delimited format, then the input dataset must be _rectangular_, i.e., a one- or two-dimensional array, an array of objects, or an object of equal-length arrays.

```js
// 1d array
const myData = ["Alona", "Noa", "Zohar", "Kirstin", "Joel"];

//2d array
const myData = [
 ["Alona", 3],
 ["Noa", 8],
 ["Zohar", 10],
 ["Kirstin", 41],
 ["Joel", 41]
];

// array of objects with common properties
const myData = [
 {"name": "Alona", "age": 3},
 {"name": "Noa", "age": 8},
 {"name": "Zohar", "age": 10},
 {"name": "Kirstin", "age": 41},
 {"name": "Joel", "age": 41}
];

// object of equal-length arrays
const myData = {
"name": ["Alona", "Noa", "Zohar", "Kirstin", "Joel"],
"age": [3, 8, 10, 41, 41]
};
```

### standardizeStructure()

This helper function takes data in one of the four rectangular formats above and returns a `data` object (containing a 2d array) and a `metadata` object:

```js
const myData = [
 {"name": "Alona", "age": 3},
 {"name": "Noa", "age": 8},
 {"name": "Zohar", "age": 10},
 {"name": "Kirstin", "age": 41},
 {"name": "Joel", "age": 41}
];
let std = SaveData.standardizeStructure(myData);
// returns
{
   "metadata": {
     "type": "array of objects", 
     "variables": {
       "names": ["name", "age"],
       "types": ["string", "integer"]
     }
   },
   "data": {
      [
        ["Alona", 3],
        ["Noa", 8],
        ["Zohar", 10],
        ["Kirstin", 41],
        ["Joel", 41]
      ]
   }
}
```

## Output Formats

With `format = 'R'` or `format = {"format": "R", "name": "familyData", "filename": "family-data"}`, you get:

```r
#family-data.R
#Assigns family dataframe
family <- data.frame("name" = character(5), age = int(5))
family$name <- c("Alona", "Noa", "Zohar", "Kirstin", "Joel")
family$age <- c(3, 8, 10, 41, 41)
```

`format = 'Python` or `format = {"format": "python", "name": "familyData", "filename": "family-data"}`:
```python
#family-data.py
#Assigns familyData to a Dictionary of lists
familyData = {"name": ["Alona", "Noa", "Zohar", "Kirstin", "Joel"], "age": [3, 8, 10, 41, 41]}
```

`format = 'csv` or `format = {"format": "delimited", "delimiter": ",", filename": "family-data"}`:
```
"name","age"
"Alona",3
"Noa",8
"Zohar",10
"Kirstin",41
"Joel",41
```

### Other Output Options

The output data format can be specified with a string (e.g., `"json"`) or an object (e.g., `{"format": "python"}`). If no format is specified, SaveData.toLog() and SaveData.toFile() will return a CSV. The format object has the following optional parameters:

 - `format`: Type of output ("csv", "delimited", "js", "json", "python", "r")
 - `delimiter`: Value-separator (only relevant if `"format": "delimited"`)
 - `filename`: Name of output file. File extension is not required.
 - `name`: Name of data object in case of R, Python, or js output formats.

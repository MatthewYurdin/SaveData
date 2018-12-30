// SaveData.js v0.0.9
// https://github.com/matthewyurdin/SaveData.js
// Matthew Yurdin, MIT License
const SaveData = (function () { 
    const distinctValues = (arr) => {
        let result = [];
        for (let i=0; i < arr.length; i++){
            if (arr[i] !== null){
                if (result.indexOf(arr[i]) === -1) result.push(arr[i]);
            }
        }
        return result;
    }
    const isMissingish = (value) => (typeof value === 'number' && isNaN(value)) || value === null || typeof value === 'undefined' || value === '';
    const detectVariableType = (arr) => {
        if (arr.some(a => typeof a === 'string') && arr.every(a => typeof a === 'string' || a === null || typeof a === 'undefined')) {
            return 'string';
        }
        else if (arr.some(a => typeof a === 'boolean') && arr.every(a => typeof a === 'boolean' || isMissingish(a))) {
                return 'boolean';
        }
        else if (arr.some(a => typeof a === 'number') && arr.every(a => typeof a === 'number' || isMissingish(a))) {
            if (arr.every(a => isMissingish(a) || a.toString().indexOf(".") === -1)) {
                return 'integer';
            } else {
                return 'real';
            }
        }
        else {
            return 'mixed or unrecognized';
        }
    }
    const detectDatasetStructure = (data) => {
        let structure = {"variables": {"names": [], "types": []}};
        if (Array.isArray(data)){
            if (!Array.isArray(data[0])) {
                if (data.every(f => (/string|number|boolean/).test(typeof f) || isMissingish(f))) {
                    return {"type": "array", "variables": {"names": ["var1"], "types": [detectVariableType(data)]}};
                }
                else if (data.every(f => (typeof f === 'object' && f.constructor === Object))){
                    structure.type = 'array of objects';
                    if (distinctValues(data.map(a => Object.keys(a).join("-"))).length === 1) { //if same vars in each row
                        structure.variables.names = Object.keys(data[0]);
                        structure.variables.types = structure.variables.names.map(m => detectVariableType(data.map(n => n[m])));
                        return structure;
                    }
                    throw new Error('Rows of dataset do not have same variables.');
                }

            }
            else if (data.every(f => Array.isArray(f))) { //if every inner element is an array
                console.log("Seem to be a array of arrays...");
                if (data.every(m => m.length === data[0].length)) { //if inner arrays have uniform length
                    structure.type = 'array of arrays';
                    for (let i = 0; i < data[0].length; i++){
                        structure.variables.names.push(`var${i+1}`);
                        structure.variables.types.push(detectVariableType(data.map(m => m[i])));
                    }
                    return structure;
                }
                throw new Error('Rows of dataset have varying numbers of variables.');
            }
        }
        else if (typeof data === 'object' && data.constructor === Object && Object.values(data).every(f => Array.isArray(f))) {
            structure.type = 'object of arrays';
            structure.variables.names = Object.keys(data);
            if (Object.values(data).every(m => m.length === data[structure.variables.names[0]].length)) { //if each variable has same length
                structure.variables.types = Object.values(data).map(m => detectVariableType(m));    
                return structure;
            }
            throw new Error('Variables have varying numbers of observations.');
        }
        throw new Error('Dataset format not recognized.');
    }
    const standardizeStructure = (dataset) => {
        let structure = detectDatasetStructure(dataset);
        if (structure.type === 'array of arrays') {
            return {"data": dataset, "metadata": structure};
        }
        else if (structure.type === 'array') {
            return {"data": dataset.map(m => [m]), "metadata": structure};
        }
        else if (structure.type === 'array of objects'){
            return {"data": dataset.map(m => Object.values(m)), "metadata": structure};
        }
        else if (structure.type === 'object of arrays'){
            let arr = Array(Object.values(dataset[structure.variables.names[0]]).length);
            for (let i = 0; i < arr.length; i++){
                let row = [];
                for (let col = 0; col < structure.variables.names.length; col++){
                    row.push(dataset[structure.variables.names[col]][i]);
                }
                arr[i] = row;
            }
            return {"data": arr, "metadata": structure};
        }
    }
    const writeDataAsR = (dataset, name) => {
        const writeValue = (value, type) => {
            if (isMissingish(value)) {
                return 'NA';
            }
            return (type === 'character') ? `"${value}"` : value;
        }
        let text = `# Dataframe assigment generated by SaveData.js\n${name} <- data.frame(`;
        const types = {"real": "numeric", "integer": "numeric", "string":"character", "mixed":"character", "boolean":"logical"};
        for (let i = 0; i < dataset.metadata.variables.names.length; i++){
            text = `${text}${dataset.metadata.variables.names[i]} = ${types[dataset.metadata.variables.types[i]]}(${dataset.data.length})${(i < (dataset.metadata.variables.names.length - 1)) ? ", " : ""}`;
        }
        text = `${text})\n`;
        for (let i = 0; i < dataset.metadata.variables.names.length; i++){
            text = `${text}${name}$${dataset.metadata.variables.names[i]} <- c(${dataset.data.map(m => writeValue(m[i], types[dataset.metadata.variables.types[i]])).join(",")})\n`;
        }
        return text;    
    }
    const writeDataAsPython = (dataset, name) => {
        const writeValue = (value, type) => {
            let textValue;
            if (isMissingish(value)){
                return 'None';
            }
            else {
                if (types[type] === "string"){
                    return `'${value}'`;
                }
                else if (types[type] === 'boolean'){
                    if (value === 'true'){
                        return 'True';
                    }
                    else if (value === 'false'){
                        return 'False';
                    }
                }
                return value;
            }
        }
        let text = `# Dict generated by SaveData.js\n${name} = {`;
        const types = {"real": "float", "integer": "int", "string": "string", "boolean": "bool", "mixed": "string"};
        for (let i = 0; i < dataset.metadata.variables.names.length; i++){
            text = `${text}'${dataset.metadata.variables.names[i]}': [${dataset.data.map(m => writeValue(m[i], dataset.metadata.variables.types[i])).join(",")}]${(i < (dataset.metadata.variables.names.length - 1)) ? ", " : "}"}`;
        }
        return text;
    }
    const writeDataAsDelimited = (dataset, delimiter) => {
        let text = `${dataset.metadata.variables.names.map(m => '"' + m + '"').join(delimiter)}\n`;
        for (let i = 0; i < dataset.data.length; i++){
            for (let j = 0; j < dataset.data[i].length; j++){
                if (!isMissingish(dataset.data[i][j])){
                    text = (dataset.metadata.variables.types[j] === 'string') ? `${text}${'"' + dataset.data[i][j] + '"'}` : `${text}${dataset.data[i][j]}`;
                }
                text = (j < (dataset.data[i].length - 1)) ? `${text}${delimiter}` : `${text}`;
            }
            text = `${text}\n`;
        }
        return text;
    }
    const writeData = (dataset, format) => {
        if (dataset){
            if (format.format === 'R'){
                return writeDataAsR(standardizeStructure(dataset), format.name);
            }
            else if (format.format === 'PYTHON'){
                return writeDataAsPython(standardizeStructure(dataset), format.name);
            }
            else if (format.format === 'DELIMITED'){
                return writeDataAsDelimited(standardizeStructure(dataset), format.delimiter);
            }
            else if (format.format === 'JS'){
                return `let ${format.name} = ${JSON.stringify(dataset)};`;
            }
            else if (format.format === "JSON") {
                return JSON.stringify(dataset);
            }
        }
        throw new Error("writeData(): input data is required (obviously).");
    }
    const normalizeFormat = (format) => {
        let normFormat = {};
        let validFormats = ["csv", "CSV", "delimited", "DELIMITED", "js", "JS", "json", "JSON", "python", "PYTHON", "py", "r", "R"];
        if (typeof format === "string"){
            if (format.toUpperCase() === "CSV" || format.toUpperCase() === "DELIMITED" || format.toUpperCase() === "JS" ||format.toUpperCase() === "JSON" || format.toUpperCase() === "PYTHON" || format.toUpperCase() === "R"){
                normFormat.format = format.toUpperCase();
                normFormat.name = "myData";
                normFormat.filename = "myExportedDataFile";
                if (normFormat.format === "DELIMITED") { 
                    normFormat.delimiter = ",";
                }
                else if (normFormat.format === "CSV") {
                    normFormat.format = "DELIMITED";
                    normFormat.delimiter = ",";
                }
                return normFormat;
            }
        }
        else if (typeof format === 'object' && format.constructor === Object) {
            if (format.format.toUpperCase() === "CSV" || format.format.toUpperCase() === "DELIMITED" || format.format.toUpperCase() === "JS" ||format.format.toUpperCase() === "JSON" || format.format.toUpperCase() === "PYTHON" || format.format.toUpperCase() === "R"){
                normFormat.format = format.format.toUpperCase() || "JSON";
                if (normFormat.format === "CSV") normFormat.format = "DELIMITED";    
                normFormat.name = format.name || "myData";
                normFormat.filename = format.filename || "myExportedDataFile";
                normFormat.delimiter = format.delimiter || ",";
                if (normFormat.format.indexOf(validFormats) > -1) {
                    return normFormat;
                }
                return normFormat;
            }
        }
        throw new Error(`normalizeFormat(): invalid output format. Valid formats: CSV, DELIMITED, JS, JSON, PYTHON, R.`);
    }
    return {
        toLog: function(data, fmt = "csv") {
            let format = normalizeFormat(fmt);
            console.log(writeData(data, format));
        },
        toFile: function(data, fmt = "csv") {
            let format = normalizeFormat(fmt);
            let dataAsText = writeData(data, format);
            let mimeTypes = {"JSON": "text/json", "JS": "text/javascript", "CSV": "text/csv", "Python": "text/x-python", "R": "text/x-r", "DELIM": "text/plain"}; 
            format.filename = format.filename.replace(/\.[a-z]*(?!\.)$/i,''); // Remove file extension if the user included one
            let fileExtensions = {"JSON": ".json", "JS": ".js", "CSV": ".csv", "PYTHON": ".py", "R": ".R", "DELIMITED": ".txt"};
            let element = document.createElement('a');
            element.setAttribute('href', ('data:' + mimeTypes[format.format] + ';charset=utf-8,' + encodeURIComponent(dataAsText)));
            element.setAttribute('download', `${format.filename}${fileExtensions[format.format]}`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        },
        standardizeStructure: standardizeStructure
    };
})();

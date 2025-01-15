const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');

const app = express();
app.use(fileUpload());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Function to extract marks from text by looking for "final mark"
const extractMarks = (text) => {
    const regex = /final mark\s*:\s*(\d+)/gi;
    const marks = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        marks.push(parseFloat(match[1]));
    }
    return marks;
};

// Handle file uploads and processing
app.post('/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const marksFile = req.files.marksFile;
    const uploadPath = path.join(__dirname, 'uploads', marksFile.name);

    marksFile.mv(uploadPath, async (err) => {
        if (err) return res.status(500).json({ error: 'File upload failed.', details: err });

        const fileExt = path.extname(marksFile.name).toLowerCase();
        let marks = [];

        try {
            if (fileExt === '.csv') {
                fs.createReadStream(uploadPath)
                    .pipe(csvParser())
                    .on('data', (row) => {
                        if (row['final mark']) {
                            marks.push(parseFloat(row['final mark']));
                        }
                    })
                    .on('end', () => {
                        const average = marks.reduce((a, b) => a + b, 0) / marks.length;
                        res.json({ average: average.toFixed(2) });
                    });
            } else if (fileExt === '.xlsx' || fileExt === '.xls') {
                const workbook = xlsx.readFile(uploadPath);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = xlsx.utils.sheet_to_json(sheet);
                marks = jsonData.map(row => parseFloat(row['final mark']));
                const average = marks.reduce((a, b) => a + b, 0) / marks.length;
                res.json({ average: average.toFixed(2) });
            } else if (fileExt === '.pdf') {
                const data = await pdfParse(fs.readFileSync(uploadPath));
                marks = extractMarks(data.text);
                const average = marks.reduce((a, b) => a + b, 0) / marks.length;
                res.json({ average: average.toFixed(2) });
            } else {
                return res.status(400).json({ error: 'Unsupported file type. Please upload a CSV, Excel, or PDF file.' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error processing file.', details: error });
        }
    });
});

// Serve the index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});

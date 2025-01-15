function uploadFile() {
    const fileInput = document.getElementById('file-upload');
    const formData = new FormData();
    formData.append('marksFile', fileInput.files[0]);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('average-result').textContent = `Average: ${data.average}`;
    })
    .catch(error => console.error('Error:', error));
}

function calculateManualAverage() {
    const marksInput = document.getElementById('marks-input').value;
    const marks = marksInput.split(',').map(Number);
    const average = marks.reduce((a, b) => a + b, 0) / marks.length;
    document.getElementById('average-result').textContent = `Average: ${average.toFixed(2)}`;
}

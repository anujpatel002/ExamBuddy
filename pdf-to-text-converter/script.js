let selectedFile = null;
let extractedText = '';

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const convertBtn = document.getElementById('convertBtn');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const status = document.getElementById('status');
const downloadSection = document.getElementById('downloadSection');
const downloadDocx = document.getElementById('downloadDocx');


// File upload handling
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
});

function handleFileSelect(file) {
    if (file.type !== 'application/pdf') {
        showStatus('Please select a PDF file', 'error');
        return;
    }
    
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.style.display = 'block';
    convertBtn.disabled = false;
    hideStatus();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Convert PDF to text
convertBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    convertBtn.disabled = true;
    progress.style.display = 'block';
    downloadSection.style.display = 'none';
    hideStatus();
    
    try {
        updateProgress(10, 'Loading PDF...');
        
        // Load PDF
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        updateProgress(20, 'Initializing OCR...');
        
        // Initialize Tesseract worker
        const worker = await Tesseract.createWorker('guj+eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(30 + (m.progress * 60));
                    updateProgress(progress, `Processing page... ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        
        extractedText = '';
        const totalPages = pdf.numPages;
        
        for (let pageNum = 1; pageNum <= Math.min(totalPages, 10); pageNum++) {
            updateProgress(30 + (pageNum / totalPages) * 60, `Processing page ${pageNum}/${totalPages}...`);
            
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render page to canvas
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            // Convert canvas to image and run OCR
            const imageData = canvas.toDataURL('image/png');
            const { data: { text } } = await worker.recognize(imageData);
            
            extractedText += `--- Page ${pageNum} ---\n${text}\n\n`;
        }
        
        await worker.terminate();
        
        updateProgress(100, 'Conversion complete!');
        
        setTimeout(() => {
            progress.style.display = 'none';
            downloadSection.style.display = 'block';
            showStatus(`Successfully extracted text from ${Math.min(totalPages, 10)} pages`, 'success');
        }, 500);
        
    } catch (error) {
        console.error('Conversion error:', error);
        progress.style.display = 'none';
        showStatus('Conversion failed: ' + error.message, 'error');
    } finally {
        convertBtn.disabled = false;
    }
});

// Download function
downloadDocx.addEventListener('click', () => {
    // Create HTML file with proper UTF-8 encoding for Gujarati text
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Extracted Text</title>
    <style>body{font-family:Arial,sans-serif;line-height:1.6;margin:20px;}</style>
</head>
<body>
    <pre>${extractedText}</pre>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name.replace('.pdf', '_extracted.html');
    a.click();
    URL.revokeObjectURL(url);
});



// Utility functions
function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
}

function hideStatus() {
    status.style.display = 'none';
}
document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS with your user ID
    // Replace with your actual EmailJS user ID
    emailjs.init('moQLyVzFTD1ooZRvr');
    
    const sendBtn = document.getElementById('sendBtn');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const csvFileInput = document.getElementById('csvFile');
    const statusDiv = document.getElementById('status');
    
    sendBtn.addEventListener('click', async function() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const file = csvFileInput.files[0];
        
        if (!title || !content || !file) {
            showStatus('Please fill all fields and upload a CSV file', 'error');
            return;
        }
        
        try {
            showStatus('Processing CSV file...', 'progress');
            const emails = await parseCSV(file);
            
            if (emails.length === 0) {
                showStatus('No valid emails found in CSV', 'error');
                return;
            }
            
            showStatus(`Sending newsletters to ${emails.length} recipients...`, 'progress');
            
            let successCount = 0;
            let errorCount = 0;
            
            // Send emails one by one with a small delay to avoid rate limiting
            for (let i = 0; i < emails.length; i++) {
                const email = emails[i];
                try {
                    await sendEmail(email, title, content);
                    successCount++;
                    
                    // Update status periodically
                    if (i % 5 === 0 || i === emails.length - 1) {
                        showStatus(`Sending... (${successCount + errorCount}/${emails.length})`, 'progress');
                    }
                    
                    // Small delay between emails (500ms)
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    errorCount++;
                    console.error(`Failed to send to ${email}:`, error);
                }
            }
            
            showStatus(`Newsletters sent successfully to ${successCount} recipients. ${errorCount} failed.`, 'success');
        } catch (error) {
            console.error('Error:', error);
            showStatus('An error occurred while sending newsletters: ' + error.message, 'error');
        }
    });
    
    function parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n');
                    const emails = [];
                    let emailIndex = -1;
                    
                    // Parse header row to find email column
                    if (lines.length > 0) {
                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                        emailIndex = headers.indexOf('email');
                    }
                    
                    if (emailIndex === -1) {
                        // If no email column found, try to use first column
                        emailIndex = 0;
                    }
                    
                    // Process each line (skip header if exists)
                    const startRow = lines.length > 1 && lines[0].includes('@') ? 0 : 1;
                    
                    for (let i = startRow; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        
                        const columns = lines[i].split(',');
                        if (columns.length > emailIndex) {
                            const email = columns[emailIndex].trim();
                            if (validateEmail(email)) {
                                emails.push(email);
                            }
                        }
                    }
                    
                    resolve(emails);
                } catch (error) {
                    reject(new Error('Error parsing CSV file'));
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Error reading CSV file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function sendEmail(toEmail, title, content) {
        // Replace with your EmailJS service ID and template ID
        return emailjs.send('service_2o8e4y8', 'template_ip0jok5', {
            to_email: toEmail,
            title: title,
            content: content
        });
    }
    
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
    }
});

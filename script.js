document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newsletterForm');
    const statusDiv = document.getElementById('status');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const content = document.getElementById('content').value.trim();
        const file = document.getElementById('csvFile').files[0];
        
        if (!title || !content || !file) {
            showStatus('Please fill all fields and upload a CSV file', 'error');
            return;
        }
        
        try {
            showStatus('Processing CSV file...', 'progress');
            const recipients = await parseCSV(file);
            
            if (recipients.length === 0) {
                showStatus('No valid recipients found in CSV', 'error');
                return;
            }
            
            showStatus(`Sending newsletters to ${recipients.length} recipients...`, 'progress');
            
            let successCount = 0;
            
            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                try {
                    await sendEmail(recipient, title, content);
                    successCount++;
                    
                    if (i % 5 === 0 || i === recipients.length - 1) {
                        showStatus(`Sending... ${successCount}/${recipients.length}`, 'progress');
                    }
                    
                    // Delay to avoid rate limiting (1 second between emails)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Failed to send to ${recipient.email}:`, error);
                }
            }
            
            showStatus(`Newsletters sent successfully to ${successCount} recipients!`, 'success');
        } catch (error) {
            console.error('Error:', error);
            showStatus('An error occurred: ' + error.message, 'error');
        }
    });
    
    function parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n');
                    const recipients = [];
                    let emailIndex = -1;
                    let nameIndex = -1;
                    
                    // Parse header row
                    if (lines.length > 0) {
                        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                        emailIndex = headers.indexOf('email');
                        nameIndex = headers.indexOf('name');
                    }
                    
                    if (emailIndex === -1) {
                        reject(new Error('CSV must contain an "email" column'));
                        return;
                    }
                    
                    // Process each line (skip header if exists)
                    const startRow = lines.length > 1 && lines[0].includes('@') ? 0 : 1;
                    
                    for (let i = startRow; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        
                        const columns = lines[i].split(',');
                        if (columns.length > emailIndex) {
                            const email = columns[emailIndex].trim();
                            if (validateEmail(email)) {
                                const name = nameIndex >= 0 && columns[nameIndex] ? 
                                    columns[nameIndex].trim() : 'Subscriber';
                                recipients.push({ email, name });
                            }
                        }
                    }
                    
                    resolve(recipients);
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
    
    async function sendEmail(recipient, title, content) {
        return new Promise((resolve) => {
            const formData = new FormData();
            formData.append('_subject', title);
            formData.append('email', recipient.email);
            formData.append('message', `Hello ${recipient.name},\n\n${content}`);
            
            // Replace with your actual email
            fetch('https://formsubmit.co/ajax/Spandan.Saxena@ibm.com', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => resolve(data))
            .catch(error => { throw error });
        });
    }
    
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
    }
});
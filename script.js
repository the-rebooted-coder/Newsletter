document.addEventListener('DOMContentLoaded', function() {
    // Initialize Material components
    const textFields = [].map.call(document.querySelectorAll('.mdc-text-field'), function(el) {
        return new mdc.textField.MDCTextField(el);
    });
    
    const buttons = [].map.call(document.querySelectorAll('.mdc-button'), function(el) {
        return new mdc.ripple.MDCRipple(el);
    });
    
    // Initialize EmailJS with your user ID
    emailjs.init('moQLyVzFTD1ooZRvr');
    
    // DOM Elements
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextBtn1 = document.getElementById('next-1');
    const nextBtn2 = document.getElementById('next-2');
    const backBtn2 = document.getElementById('back-2');
    const backBtn3 = document.getElementById('back-3');
    const sendBtn = document.getElementById('sendBtn');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const csvFileInput = document.getElementById('csvFile');
    const fileInfo = document.getElementById('fileInfo');
    const statusDiv = document.getElementById('status');
    const contentStepTitle = document.getElementById('content-step-title');
    const startOverBtn = document.getElementById('startOver');
    const successState = document.getElementById('success-state');
    
    let currentStep = 1;
    
    // Event Listeners
    nextBtn1.addEventListener('click', nextStep);
    nextBtn2.addEventListener('click', nextStep);
    backBtn2.addEventListener('click', prevStep);
    backBtn3.addEventListener('click', prevStep);
    startOverBtn.addEventListener('click', () => location.reload());
    
    csvFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileInfo.textContent = this.files[0].name;
            sendBtn.disabled = false;
        } else {
            fileInfo.textContent = 'No file selected';
            sendBtn.disabled = true;
        }
    });
    
    sendBtn.addEventListener('click', async function() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const file = csvFileInput.files[0];
        
        if (!title || !content || !file) {
            showStatus('Please fill all fields and upload a CSV file', 'error');
            return;
        }
        
        const secretCode = prompt(`Please enter the secret code to send newsletters.\n\nThis verification helps ensure fair usage and prevent abuse.`, '');
        
        if (secretCode !== '123456') {
            showStatus('Error: Incorrect secret code. Newsletters not sent.', 'error');
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
            let errorCount = 0;
            
            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                try {
                    await sendEmail(recipient.email, recipient.name, title, content);
                    successCount++;
                    
                    if (i % 5 === 0 || i === recipients.length - 1) {
                        showStatus(`Sending... (${successCount + errorCount}/${recipients.length})`, 'progress');
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    errorCount++;
                    console.error(`Failed to send to ${recipient.email}:`, error);
                }
            }
            
            // Show success state
            document.querySelector('.progress-bar').style.display = 'none';
            document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
            successState.classList.add('show');
            showStatus(`Newsletters sent successfully to ${successCount} recipients. ${errorCount} failed.`, 'success');
        } catch (error) {
            console.error('Error:', error);
            showStatus('An error occurred while sending newsletters: ' + error.message, 'error');
        }
    });
    
    // Functions
    async function nextStep() {
        if (currentStep >= 3) return;
        
        // Get current active button
        const activeButton = currentStep === 1 ? nextBtn1 : nextBtn2;
        
        // Validate current step before proceeding
        if (currentStep === 1 && !titleInput.value.trim()) {
            showStatus('Please enter a title for your newsletter', 'error');
            return;
        }
        
        if (currentStep === 2 && !contentInput.value.trim()) {
            showStatus('Please enter content for your newsletter', 'error');
            return;
        }
        
        // Add loading state to button
        activeButton.classList.add('mdc-button--loading');
        activeButton.disabled = true;
        
        // Update step 2 title if moving from step 1
        if (currentStep === 1) {
            const titleElement = document.getElementById('content-step-title');
            if (titleElement) {
                titleElement.textContent = `${titleInput.value.trim()} ✏️`;
            }
        }
        
        // Add slight delay for animation to be visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hide current step
        steps[currentStep - 1].classList.remove('active');
        progressSteps[currentStep - 1].classList.remove('active');
        
        currentStep++;
        
        // Show next step
        steps[currentStep - 1].classList.add('active');
        progressSteps[currentStep - 1].classList.add('active');
        
        // Remove loading state
        activeButton.classList.remove('mdc-button--loading');
        activeButton.disabled = false;
        
        window.scrollTo(0, 0);
    }
    
    function prevStep() {
        if (currentStep <= 1) return;
        
        steps[currentStep - 1].classList.remove('active');
        progressSteps[currentStep - 1].classList.remove('active');
        
        currentStep--;
        
        steps[currentStep - 1].classList.add('active');
        progressSteps[currentStep - 1].classList.add('active');
        
        window.scrollTo(0, 0);
    }
    
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status show ' + type;
        
        if (type !== 'progress') {
            setTimeout(() => {
                statusDiv.classList.remove('show');
            }, 5000);
        }
    }
    
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
                        emailIndex = 0;
                    }
                    
                    const startRow = lines.length > 1 && lines[0].includes('@') ? 0 : 1;
                    
                    for (let i = startRow; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        
                        const columns = lines[i].split(',');
                        if (columns.length > emailIndex) {
                            const email = columns[emailIndex].trim();
                            if (validateEmail(email)) {
                                const name = nameIndex >= 0 && columns[nameIndex] ? columns[nameIndex].trim() : '';
                                recipients.push({
                                    email: email,
                                    name: name
                                });
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
    
    function sendEmail(toEmail, name, title, content) {
        return emailjs.send('service_2o8e4y8', 'template_ip0jok5', {
            to_email: toEmail,
            name: name,
            title: title,
            content: content
        });
    }
});
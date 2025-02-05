document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed.");

    const generateEmailBtn = document.getElementById('generateEmailBtn');
    const checkBtn = document.getElementById('checkBtn');
    const generatedEmailInput = document.getElementById('generatedEmail');
    const emailInput = document.getElementById('emailInput');
    const emailContent = document.getElementById('emailContent');
    const bgUploader = document.getElementById("bgUploader");

    let pollingInterval;

    // ** Function to Generate Temporary Email **
    function generateEmail() {
        Swal.fire({
            title: 'Generating Email...',
            text: 'Please wait while we generate your temporary email.',
            didOpen: () => Swal.showLoading()
        });

        axios.post('https://pyeulmail-serverapi-production.up.railway.app/generate_email')
            .then(response => {
                const { email, sid_token } = response.data;
                if (email && sid_token) {
                    generatedEmailInput.value = email;
                    emailInput.value = email;
                    localStorage.setItem('sid_token', sid_token);
                    startPolling(sid_token);
                    Swal.fire('Email Generated!', `Your email: ${email}`, 'success');
                } else {
                    Swal.fire('Error', 'Invalid response from server.', 'error');
                }
            })
            .catch(() => Swal.fire('Error', 'Error generating email. Please try again.', 'error'));
    }

    // ** Function to Fetch Messages **
    function fetchMessages(sidToken, seq = 0) {
        axios.post('https://pyeulmail-serverapi-production.up.railway.app/check_messages', { sid_token: sidToken, seq })
            .then(response => {
                const mailList = response.data.messages || [];
                displayMessages(mailList);
            })
            .catch(() => Swal.fire('Error', 'Error fetching messages. Please try again.', 'error'));
    }

    // ** Function to Display Messages in Inbox **
    function displayMessages(messages) {
        emailContent.innerHTML = messages.length === 0
            ? '<p style="color:#ff3399; text-align:center;">No messages available.</p>'
            : '';

        messages.forEach(message => {
            const emailItem = document.createElement('div');
            emailItem.classList.add('email-item', 'p-2', 'mb-2', 'rounded-3');
            emailItem.style.background = '#ffe6f1';
            emailItem.style.cursor = 'pointer';
            emailItem.style.border = '1px solid #ff3399';

            const sender = message.mail_from || 'Unknown';
            const displaySender = sender.includes('@') ? sender.split('@')[0] : sender;

            emailItem.innerHTML = `
                <strong>From:</strong> ${displaySender}<br>
                <strong>Subject:</strong> ${message.mail_subject || 'No Subject'}<br>
                <button class="btn btn-sm mt-2" style="background:#ff66b2; color:white; border:none;"
                    onclick="viewEmailContent('${message.mail_id}')">📩 View</button>
            `;

            emailContent.appendChild(emailItem);
        });
    }

    // ** Function to View Full Email Content **
    window.viewEmailContent = function(mailId) {
        const sidToken = localStorage.getItem('sid_token');

        Swal.fire({
            title: 'Fetching Email Content...',
            text: 'Please wait while we retrieve the email content.',
            didOpen: () => Swal.showLoading()
        });

        axios.get('https://pyeulmail-serverapi-production.up.railway.app/fetch_email', {
            params: { mail_id: mailId, sid_token: sidToken }
        })
        .then(response => Swal.fire({ title: 'Email Content', html: `<p>${response.data}</p>`, icon: 'info' }))
        .catch(() => Swal.fire('Error', 'Error fetching email content. Please try again.', 'error'));
    };

    // ** Function to Start Polling Messages **
    function startPolling(sidToken) {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        fetchMessages(sidToken);
        pollingInterval = setInterval(() => fetchMessages(sidToken), 15000);
    }

    // ** Event Listeners **
    generateEmailBtn?.addEventListener('click', generateEmail);
    checkBtn?.addEventListener('click', () => {
        const sidToken = localStorage.getItem('sid_token');
        sidToken ? fetchMessages(sidToken) : Swal.fire('Error', 'No SID token found. Please generate an email first.', 'error');
    });

    // ** Background Image Uploader **
    bgUploader?.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function () {
                document.body.style.backgroundImage = `url(${reader.result})`;
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
            };
            reader.readAsDataURL(file);
        } else {
            Swal.fire('Error', 'Please upload a valid image file.', 'error');
        }
    });

    // ** Hover Effect on Inbox Messages **
    emailContent?.addEventListener('mouseover', function (e) {
        if (e.target.closest('.email-item')) {
            e.target.closest('.email-item').style.backgroundColor = '#f0f0f0';
        }
    });

    emailContent?.addEventListener('mouseout', function (e) {
        if (e.target.closest('.email-item')) {
            e.target.closest('.email-item').style.backgroundColor = '#ffe6f1';
        }
    });
});

const API_BASE = '/api';
let isLoggedIn = false;

function log(message, type = 'info') {
    const logContent = document.getElementById('logContent');
    const timestamp = new Date().toLocaleTimeString();
    logContent.textContent += `[${timestamp}] ${message}\n`;
    logContent.scrollTop = logContent.scrollHeight;
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function updateStatus(text, type = 'info') {
    const statusText = document.getElementById('statusText');
    const statusIcon = document.getElementById('statusIcon');
    const statusEl = document.getElementById('status');
    
    statusText.textContent = text;
    statusIcon.textContent = type === 'success' ? '✅' : 
                            type === 'error' ? '❌' : 
                            type === 'warning' ? '⚠️' : '⏳';
    
    statusEl.className = `status ${type}`;
}

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        log(`API Error: ${error.message}`, 'error');
        throw error;
    }
}

async function login() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    try {
        const qrUrl = window.location.origin;
        document.getElementById('qrUrl').textContent = qrUrl;
        
        const result = await apiCall('/login', 'POST', { headless: false });
        
        if (result.success) {
            isLoggedIn = true;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('botSection').style.display = 'grid';
            updateStatus('✅ Connected to WhatsApp!', 'success');
            log('✅ WhatsApp login successful');
        } else {
            updateStatus('❌ Login failed: ' + result.message, 'error');
            log('❌ Login failed: ' + result.message, 'error');
        }
    } catch (error) {
        updateStatus('❌ Connection error', 'error');
        log('❌ Connection error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-qrcode"></i> Login to WhatsApp';
    }
}

async function createGroup() {
    const groupName = document.getElementById('groupName').value.trim();
    const participantsText = document.getElementById('participants').value.trim();
    
    if (!groupName || !participantsText) {
        alert('Please fill group name and members');
        return;
    }
    
    const participants = participantsText.split('\n').map(p => p.trim()).filter(Boolean);
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    try {
        log(`Creating group "${groupName}" with ${participants.length} members...`);
        const result = await apiCall('/create-group', 'POST', { 
            group_name: groupName, 
            participants 
        });
        
        if (result.success) {
            updateStatus(`✅ Created "${result.group}"`, 'success');
            log(`✅ Group "${result.group}" created with ${result.members} members`);
            document.getElementById('groupName').value = '';
            document.getElementById('participants').value = '';
        } else {
            updateStatus('❌ ' + result.message, 'error');
            log('❌ ' + result.message, 'error');
        }
    } catch (error) {
        log('❌ Create group failed: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Create Group';
    }
}

async function addMembers() {
    const groupName = document.getElementById('targetGroup').value.trim();
    const membersText = document.getElementById('newMembers').value.trim();
    
    if (!groupName || !membersText) {
        alert('Please fill group name and members');
        return;
    }
    
    const members = membersText.split('\n').map(m => m.trim()).filter(Boolean);
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    try {
        log(`Adding ${members.length} members to "${groupName}"...`);
        const result = await apiCall('/add-members', 'POST', { 
            group_name: groupName, 
            members 
        });
        
        if (result.success) {
            updateStatus(`✅ Added ${result.added} members`, 'success');
            log(`✅ Added ${result.added} members to "${groupName}"`);
            document.getElementById('targetGroup').value = '';
            document.getElementById('newMembers').value = '';
        } else {
            updateStatus('❌ ' + result.message, 'error');
            log('❌ ' + result.message, 'error');
        }
    } catch (error) {
        log('❌ Add members failed: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Add Members';
    }
}

async function logout() {
    try {
        await apiCall('/logout', 'POST');
        isLoggedIn = false;
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('botSection').style.display = 'none';
        updateStatus('Logged out', 'warning');
        log('🔓 Logged out');
        document.getElementById('logContent').textContent = '';
    } catch (error) {
        log('Logout error: ' + error.message, 'error');
    }
}

function clearLog() {
    document.getElementById('logContent').textContent = '';
}

// Check status on load
window.addEventListener('load', async () => {
    try {
        const status = await apiCall('/status');
        if (status.session_active) {
            isLoggedIn = true;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('botSection').style.display = 'grid';
            updateStatus('✅ Session active', 'success');
        }
    } catch (e) {
        // Not running yet
    }
    
    // Update QR URL
    document.getElementById('qrUrl').textContent = window.location.origin;
});

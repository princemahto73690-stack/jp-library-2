/* ============================================
   JP Library - Admin Dashboard JavaScript
   ============================================ */

let allBookings = {};
let allSeatsData = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadAdminData();
    setAdminName();
});

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Manual booking form
    document.getElementById('manualBookingForm').addEventListener('submit', submitManualBooking);

    // Modal close
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('requestModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('requestModal')) {
            closeModal();
        }
    });
}

function setAdminName() {
    // Get admin name from session (would normally come from server)
    document.getElementById('adminName').textContent = 'Admin';
}

// Tab Switching
function switchTab(e) {
    const tabName = e.target.getAttribute('data-tab');
    
    // Update button active state
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    const tabId = tabName + 'Tab';
    const tabEl = document.getElementById(tabId);
    if (tabEl) {
        tabEl.classList.add('active');
    }

    // Load data for specific tabs
    if (tabName === 'pending') {
        loadPendingRequests();
    } else if (tabName === 'all') {
        loadAllBookings();
    } else if (tabName === 'map') {
        loadSeatMap();
    }
}

// Load Admin Data
async function loadAdminData() {
    await loadPendingRequests();
    await loadSeatMap();
}

// Load Pending Requests
async function loadPendingRequests() {
    try {
        const response = await fetch('/api/admin/pending-requests');
        const requests = await response.json();
        
        const listContainer = document.getElementById('pendingList');
        
        if (requests.length === 0) {
            listContainer.innerHTML = '<p class="loading">कोई अनुमति प्रतीक्षा नहीं है</p>';
            return;
        }

        let html = '';
        requests.forEach(req => {
            html += createRequestCard(req, 'pending');
        });
        listContainer.innerHTML = html;

        // Add event listeners to action buttons
        attachRequestActions();

    } catch (error) {
        console.error('Error:', error);
        showToast('अनुरोध लोड करने में त्रुटि', 'error');
    }
}

// Load All Bookings
async function loadAllBookings() {
    try {
        const response = await fetch('/api/admin/all-bookings');
        const bookings = await response.json();
        allBookings = bookings;

        const listContainer = document.getElementById('allList');
        
        if (bookings.length === 0) {
            listContainer.innerHTML = '<p class="loading">कोई बुकिंग नहीं</p>';
            return;
        }

        let html = '';
        bookings.forEach(booking => {
            html += createRequestCard(booking, 'all');
        });
        listContainer.innerHTML = html;

        // Add event listeners to action buttons
        attachRequestActions();

    } catch (error) {
        console.error('Error:', error);
        showToast('बुकिंग लोड करने में त्रुटि', 'error');
    }
}

// Create Request Card
function createRequestCard(req, context) {
    const statusClass = req.status === 'pending' ? 'pending' : 'paid';
    const statusText = req.status === 'pending' ? 'प्रतीक्षा' : 'भुगतान किया गया';
    
    let actionsHtml = '';
    
    if (context === 'pending' && req.status === 'pending') {
        actionsHtml = `
            <div class="request-actions">
                <select class="payment-method-select" data-booking-id="${req.booking_id}">
                    <option value="cash">नकद</option>
                    <option value="online">ऑनलाइन</option>
                </select>
                <button class="btn-approve" onclick="approveBooking(${req.booking_id})">मंजूरी दें</button>
                <button class="btn-reject" onclick="rejectBooking(${req.booking_id})">अस्वीकार करें</button>
            </div>
        `;
    } else if (context === 'all' && req.status === 'paid') {
        actionsHtml = `
            <div class="request-actions">
                <button class="btn-delete" onclick="deleteBooking(${req.booking_id})">हटाएं</button>
            </div>
        `;
    }

    return `
        <div class="request-card">
            <h3>सीट <span class="seat-badge">${req.seat_number}</span></h3>
            <p><strong>नाम:</strong> ${req.student_name}</p>
            <p><strong>गाँव:</strong> ${req.village}</p>
            <p><strong>पिता:</strong> ${req.father_name}</p>
            <p><strong>मोबाइल:</strong> ${req.mobile_number}</p>
            <p><strong>कक्षा:</strong> ${req.class_level}</p>
            <p>
                <strong>स्थिति:</strong> 
                <span class="status-badge ${statusClass}">${statusText}</span>
            </p>
            ${req.expiry_date ? `<p><strong>समाप्ति:</strong> ${req.expiry_date}</p>` : ''}
            ${actionsHtml}
        </div>
    `;
}

// Attach Request Actions
function attachRequestActions() {
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
}

// Approve Booking
async function approveBooking(bookingId) {
    const paymentSelect = document.querySelector(`[data-booking-id="${bookingId}"]`);
    const paymentMethod = paymentSelect ? paymentSelect.value : 'cash';

    if (!confirm('क्या आप इस बुकिंग को मंजूरी देना चाहते हैं?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/approve-booking/${bookingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payment_method: paymentMethod })
        });

        const data = await response.json();

        if (data.success) {
            showToast('बुकिंग मंजूरी दी गई', 'success');
            loadPendingRequests();
            loadSeatMap();
        } else {
            showToast('मंजूरी विफल: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('त्रुटि: मंजूरी नहीं दी जा सकी', 'error');
    }
}

// Reject Booking
async function rejectBooking(bookingId) {
    if (!confirm('क्या आप इस बुकिंग को अस्वीकार करना चाहते हैं?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/reject-booking/${bookingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('बुकिंग अस्वीकार की गई', 'success');
            loadPendingRequests();
            loadSeatMap();
        } else {
            showToast('अस्वीकार विफल: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('त्रुटि: बुकिंग अस्वीकार नहीं की जा सकी', 'error');
    }
}

// Delete Booking
async function deleteBooking(bookingId) {
    if (!confirm('क्या आप इस बुकिंग को हटाना चाहते हैं? यह सीट उपलब्ध हो जाएगी।')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/delete-booking/${bookingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('बुकिंग हटाई गई', 'success');
            loadAllBookings();
            loadSeatMap();
        } else {
            showToast('हटाना विफल: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('त्रुटि: बुकिंग नहीं हटाई जा सकी', 'error');
    }
}

// Manual Booking Submit
async function submitManualBooking(e) {
    e.preventDefault();

    const formData = {
        seat_number: parseInt(document.getElementById('manualSeat').value),
        student_name: document.getElementById('manualName').value,
        village: document.getElementById('manualVillage').value,
        father_name: document.getElementById('manualFather').value,
        mobile_number: document.getElementById('manualMobile').value,
        class_level: document.getElementById('manualClass').value,
        payment_method: document.getElementById('manualPayment').value
    };

    // Validation
    if (formData.seat_number < 1 || formData.seat_number > 53) {
        showToast('कृपया 1-53 के बीच सीट संख्या दर्ज करें', 'error');
        return;
    }

    if (!formData.student_name.trim()) {
        showToast('कृपया नाम दर्ज करें', 'error');
        return;
    }

    if (!formData.mobile_number.match(/^\d{10}$/)) {
        showToast('कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/manual-book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('manualBookingForm').reset();
            loadAllBookings();
            loadSeatMap();
        } else {
            showToast('बुकिंग विफल: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('त्रुटि: बुकिंग नहीं की जा सकी', 'error');
    }
}

// Load Seat Map
async function loadSeatMap() {
    try {
        const response = await fetch('/api/seats');
        const seats = await response.json();
        allSeatsData = seats;

        const mapContainer = document.getElementById('mapContainer');
        let html = '<div class="admin-seat-grid">';

        for (let i = 1; i <= 53; i++) {
            const seatInfo = seats[i];
            const status = seatInfo ? seatInfo.status : 'available';
            html += `<div class="admin-seat ${status}" data-seat="${i}">${i}</div>`;
        }

        html += '</div>';
        mapContainer.innerHTML = html;

        // Update statistics
        updateMapStats(seats);

    } catch (error) {
        console.error('Error:', error);
        showToast('सीट मानचित्र लोड करने में त्रुटि', 'error');
    }
}

// Update Map Statistics
function updateMapStats(seats) {
    let available = 0, paid = 0, pending = 0;

    for (let i = 1; i <= 53; i++) {
        if (seats[i]) {
            switch(seats[i].status) {
                case 'available':
                    available++;
                    break;
                case 'paid':
                    paid++;
                    break;
                case 'pending':
                    pending++;
                    break;
            }
        } else {
            available++;
        }
    }

    document.getElementById('statAvailable').textContent = available;
    document.getElementById('statPaid').textContent = paid;
    document.getElementById('statPending').textContent = pending;
}

// Modal Functions
function closeModal() {
    document.getElementById('requestModal').classList.remove('active');
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Auto-refresh data every 15 seconds
setInterval(() => {
    const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
    if (activeTab === 'pending') {
        loadPendingRequests();
    } else if (activeTab === 'all') {
        loadAllBookings();
    }
    loadSeatMap();
}, 15000);

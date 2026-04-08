/* ============================================
   JP Library - Student Interface JavaScript
   ============================================ */

let currentSeat = null;
let allSeats = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadSeats();
});

function setupEventListeners() {
    // Welcome screen
    document.getElementById('proceedBtn').addEventListener('click', showIntentScreen);

    // Intent screen
    document.getElementById('yesBtn').addEventListener('click', showSeatScreen);
    document.getElementById('noBtn').addEventListener('click', showThankYouScreen);

    // Seat screen
    document.getElementById('backBtn').addEventListener('click', showIntentScreen);
    document.getElementById('closeFormBtn').addEventListener('click', showSeatScreen);

    // Form submission
    document.getElementById('bookingForm').addEventListener('submit', submitBooking);

    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
        location.reload();
    });
}

// Screen Navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showIntentScreen() {
    showScreen('intentScreen');
}

function showSeatScreen() {
    showScreen('seatScreen');
    loadSeats();
}

function showThankYouScreen() {
    showScreen('thankYouScreen');
    document.getElementById('thankYouMessage').textContent = 
        'जे.पी. लाइब्रेरी से जुड़ने के लिए आपका बहुत-बहुत धन्यवाद!';
}

function showFormScreen(seatNumber) {
    currentSeat = seatNumber;
    document.getElementById('selectedSeat').textContent = seatNumber;
    document.getElementById('studentName').value = '';
    document.getElementById('village').value = '';
    document.getElementById('fatherName').value = '';
    document.getElementById('mobile').value = '';
    document.getElementById('classLevel').value = '';
    showScreen('formScreen');
}

// Load and Display Seats
async function loadSeats() {
    try {
        const response = await fetch('/api/seats');
        const seats = await response.json();
        allSeats = seats;
        renderSeats(seats);
    } catch (error) {
        console.error('Error loading seats:', error);
        showToast('सीटें लोड करने में त्रुटि', 'error');
    }
}

function renderSeats(seats) {
    document.querySelectorAll('.seat[data-seat]').forEach(seatEl => {
        const seatNum = parseInt(seatEl.getAttribute('data-seat'));
        const seatInfo = seats[seatNum];

        // Remove previous status classes
        seatEl.classList.remove('available', 'paid', 'pending');

        if (seatInfo) {
            seatEl.classList.add(seatInfo.status);

            // Add click handler for available seats
            if (seatInfo.status === 'available') {
                seatEl.style.cursor = 'pointer';
                seatEl.addEventListener('click', () => showFormScreen(seatNum));
            } else {
                seatEl.style.cursor = 'not-allowed';
            }
        }
    });
}

// Form Submission
async function submitBooking(e) {
    e.preventDefault();

    const formData = {
        seat_number: currentSeat,
        student_name: document.getElementById('studentName').value,
        village: document.getElementById('village').value,
        father_name: document.getElementById('fatherName').value,
        mobile_number: document.getElementById('mobile').value,
        class_level: document.getElementById('classLevel').value
    };

    // Validation
    if (!formData.student_name.trim()) {
        showToast('कृपया नाम दर्ज करें', 'error');
        return;
    }

    if (!formData.mobile_number.match(/^\d{10}$/)) {
        showToast('कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें', 'error');
        return;
    }

    try {
        const response = await fetch('/api/book-seat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            await new Promise(resolve => setTimeout(resolve, 1500));
            document.getElementById('thankYouMessage').textContent = 
                'आपका बुकिंग अनुरोध सफलतापूर्वक जमा किया गया है।\n\nकृपया प्रशासक की मंजूरी की प्रतीक्षा करें।';
            showScreen('thankYouScreen');
        } else {
            showToast(data.error || 'बुकिंग विफल', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('त्रुटि: बुकिंग जमा नहीं की जा सकी', 'error');
    }
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

// Auto-refresh seats every 10 seconds
setInterval(() => {
    if (document.getElementById('seatScreen').classList.contains('active')) {
        loadSeats();
    }
}, 10000);

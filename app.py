from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
from functools import wraps
import json

app = Flask(__name__)
app.secret_key = 'jp_library_secret_2024'
CORS(app)

DATABASE = 'library.db'

# Helper Functions
def get_db():
    """Get database connection"""
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initialize database from schema"""
    if not os.path.exists(DATABASE):
        db = get_db()
        with open('schema.sql', 'r', encoding='utf-8') as f:
            db.cursor().executescript(f.read())
        db.commit()
        db.close()

def login_required(f):
    """Decorator for admin-only routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def get_seat_status():
    """Get all seats with their current status"""
    db = get_db()
    cursor = db.cursor()
    
    # Get seat information with booking details
    cursor.execute('''
        SELECT 
            s.seat_number,
            s.status,
            b.booking_id,
            b.student_name,
            b.status as booking_status,
            b.expiry_date
        FROM seats s
        LEFT JOIN bookings b ON s.seat_number = b.seat_number
        ORDER BY s.seat_number
    ''')
    
    seats = cursor.fetchall()
    db.close()
    
    result = {}
    for seat in seats:
        seat_num = seat['seat_number']
        booking_status = seat['booking_status']
        
        # Determine seat color status
        if booking_status == 'pending':
            status = 'pending'  # Yellow
        elif booking_status == 'paid':
            # Check if expired
            if seat['expiry_date']:
                expiry = datetime.strptime(seat['expiry_date'], '%Y-%m-%d')
                if datetime.now() > expiry:
                    status = 'available'  # Reset to available
                    # Update database
                    db = get_db()
                    db.execute('DELETE FROM bookings WHERE seat_number = ?', (seat_num,))
                    db.execute('UPDATE seats SET status = ? WHERE seat_number = ?', ('available', seat_num))
                    db.commit()
                    db.close()
                else:
                    status = 'paid'  # Red
            else:
                status = 'paid'
        else:
            status = 'available'  # Green
        
        result[seat_num] = {
            'status': status,
            'student_name': seat['student_name'],
            'booking_id': seat['booking_id']
        }
    
    return result

# Routes
@app.route('/')
def index():
    """Student Welcome Page"""
    return render_template('index.html')

@app.route('/api/seats')
def api_seats():
    """API endpoint to get all seat statuses"""
    seats = get_seat_status()
    return jsonify(seats)

@app.route('/api/book-seat', methods=['POST'])
def book_seat():
    """API endpoint to book a seat"""
    try:
        data = request.get_json()
        seat_number = data.get('seat_number')
        student_name = data.get('student_name')
        village = data.get('village')
        father_name = data.get('father_name')
        mobile_number = data.get('mobile_number')
        class_level = data.get('class_level')
        
        # Validation
        if not all([seat_number, student_name, village, father_name, mobile_number, class_level]):
            return jsonify({'success': False, 'error': 'सभी फील्ड आवश्यक हैं'}), 400
        
        if not str(mobile_number).isdigit() or len(mobile_number) != 10:
            return jsonify({'success': False, 'error': 'सही मोबाइल नंबर दर्ज करें'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        # Check if seat is available
        cursor.execute('SELECT seat_number FROM bookings WHERE seat_number = ?', (seat_number,))
        if cursor.fetchone():
            db.close()
            return jsonify({'success': False, 'error': 'यह सीट पहले से बुक है'}), 400
        
        # Create booking
        cursor.execute('''
            INSERT INTO bookings 
            (seat_number, student_name, village, father_name, mobile_number, class_level, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (seat_number, student_name, village, father_name, mobile_number, class_level, 'pending'))
        
        # Update seat status
        cursor.execute('UPDATE seats SET status = ? WHERE seat_number = ?', ('pending', seat_number))
        
        # Log action
        cursor.execute('''
            INSERT INTO session_logs (session_type, student_name, seat_number, action)
            VALUES (?, ?, ?, ?)
        ''', ('student_session', student_name, seat_number, 'booked'))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True, 
            'message': 'आपका बुकिंग अनुरोध सफलतापूर्वक जमा किया गया है। कृपया प्रशासक की मंजूरी की प्रतीक्षा करें।'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/seat/<int:seat_number>')
def get_seat_info(seat_number):
    """Get information about a specific seat"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT b.* FROM bookings b
            WHERE b.seat_number = ?
        ''', (seat_number,))
        
        booking = cursor.fetchone()
        db.close()
        
        if booking:
            return jsonify({
                'exists': True,
                'booking': dict(booking)
            })
        return jsonify({'exists': False})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin Routes
@app.route('/admin')
def admin():
    """Admin Dashboard"""
    if 'admin_id' not in session:
        return redirect(url_for('admin_login'))
    return render_template('admin.html')

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin Login"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT admin_id FROM admin_users WHERE username = ? AND password = ?', 
                      (username, password))
        admin = cursor.fetchone()
        db.close()
        
        if admin:
            session['admin_id'] = admin['admin_id']
            session['username'] = username
            return redirect(url_for('admin'))
        else:
            return render_template('admin_login.html', error='Invalid credentials')
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    """Admin Logout"""
    session.clear()
    return redirect(url_for('admin_login'))

@app.route('/api/admin/pending-requests')
@login_required
def get_pending_requests():
    """Get all pending booking requests"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT * FROM bookings 
            WHERE status = 'pending'
            ORDER BY created_at DESC
        ''')
        
        requests = [dict(row) for row in cursor.fetchall()]
        db.close()
        
        return jsonify(requests)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/approve-booking/<int:booking_id>', methods=['POST'])
@login_required
def approve_booking(booking_id):
    """Approve a pending booking"""
    try:
        data = request.get_json()
        payment_method = data.get('payment_method', 'cash')
        
        if payment_method not in ['cash', 'online']:
            return jsonify({'success': False, 'error': 'Invalid payment method'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        # Get booking details
        cursor.execute('SELECT * FROM bookings WHERE booking_id = ?', (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            db.close()
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        # Update booking status
        expiry_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        cursor.execute('''
            UPDATE bookings 
            SET status = ?, payment_method = ?, approved_at = ?, expiry_date = ?
            WHERE booking_id = ?
        ''', ('paid', payment_method, datetime.now().isoformat(), expiry_date, booking_id))
        
        # Update seat status
        cursor.execute('UPDATE seats SET status = ? WHERE seat_number = ?', 
                      ('paid', booking['seat_number']))
        
        # Log action
        cursor.execute('''
            INSERT INTO session_logs (session_type, student_name, seat_number, action)
            VALUES (?, ?, ?, ?)
        ''', ('admin_action', booking['student_name'], booking['seat_number'], 'approved'))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': f"Booking {booking_id} approved. Expires: {expiry_date}"
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/reject-booking/<int:booking_id>', methods=['POST'])
@login_required
def reject_booking(booking_id):
    """Reject a pending booking"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get booking details
        cursor.execute('SELECT * FROM bookings WHERE booking_id = ?', (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            db.close()
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        seat_number = booking['seat_number']
        
        # Delete booking
        cursor.execute('DELETE FROM bookings WHERE booking_id = ?', (booking_id,))
        
        # Reset seat status to available
        cursor.execute('UPDATE seats SET status = ? WHERE seat_number = ?', ('available', seat_number))
        
        # Log action
        cursor.execute('''
            INSERT INTO session_logs (session_type, student_name, seat_number, action)
            VALUES (?, ?, ?, ?)
        ''', ('admin_action', booking['student_name'], seat_number, 'rejected'))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': f"Booking {booking_id} rejected"
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/manual-book', methods=['POST'])
@login_required
def manual_book():
    """Admin manually books a seat for a student"""
    try:
        data = request.get_json()
        seat_number = data.get('seat_number')
        student_name = data.get('student_name')
        village = data.get('village')
        father_name = data.get('father_name')
        mobile_number = data.get('mobile_number')
        class_level = data.get('class_level')
        payment_method = data.get('payment_method', 'cash')
        
        # Validation
        if not all([seat_number, student_name, village, father_name, mobile_number, class_level]):
            return jsonify({'success': False, 'error': 'All fields required'}), 400
        
        db = get_db()
        cursor = db.cursor()
        
        # Check if seat is already booked
        cursor.execute('SELECT seat_number FROM bookings WHERE seat_number = ?', (seat_number,))
        if cursor.fetchone():
            db.close()
            return jsonify({'success': False, 'error': 'Seat already booked'}), 400
        
        # Create booking with paid status
        expiry_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        cursor.execute('''
            INSERT INTO bookings 
            (seat_number, student_name, village, father_name, mobile_number, class_level, 
             status, payment_method, approved_at, expiry_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (seat_number, student_name, village, father_name, mobile_number, class_level,
              'paid', payment_method, datetime.now().isoformat(), expiry_date))
        
        # Update seat status
        cursor.execute('UPDATE seats SET status = ? WHERE seat_number = ?', ('paid', seat_number))
        
        # Log action
        cursor.execute('''
            INSERT INTO session_logs (session_type, student_name, seat_number, action)
            VALUES (?, ?, ?, ?)
        ''', ('admin_action', student_name, seat_number, 'booked'))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': f"Seat {seat_number} booked for {student_name}. Expires: {expiry_date}"
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/all-bookings')
@login_required
def get_all_bookings():
    """Get all bookings (paid and pending)"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('''
            SELECT * FROM bookings 
            ORDER BY created_at DESC
        ''')
        
        bookings = [dict(row) for row in cursor.fetchall()]
        db.close()
        
        return jsonify(bookings)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/delete-booking/<int:booking_id>', methods=['POST'])
@login_required
def delete_booking(booking_id):
    """Delete a booking and free up the seat"""
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Get booking details
        cursor.execute('SELECT * FROM bookings WHERE booking_id = ?', (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            db.close()
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        seat_number = booking['seat_number']
        
        # Delete booking
        cursor.execute('DELETE FROM bookings WHERE booking_id = ?', (booking_id,))
        
        # Reset seat status to available
        cursor.execute('UPDATE seats SET status = ? WHERE seat_number = ?', ('available', seat_number))
        
        db.commit()
        db.close()
        
        return jsonify({
            'success': True,
            'message': f"Booking deleted and seat {seat_number} is now available"
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)

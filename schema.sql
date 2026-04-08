-- JP Library Seat Management System Database Schema

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students/Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    seat_number INTEGER NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    village TEXT NOT NULL,
    father_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    class_level TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    -- Status: 'available', 'pending', 'paid', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    expiry_date DATE,
    payment_method TEXT,
    -- Payment Method: 'cash', 'online', NULL if pending
    notes TEXT
);

-- Seat Configuration Table
CREATE TABLE IF NOT EXISTS seats (
    seat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    seat_number INTEGER NOT NULL UNIQUE,
    status TEXT DEFAULT 'available',
    -- Status: 'available', 'booked', 'paid', 'pending'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session Logs (for audit trail)
CREATE TABLE IF NOT EXISTS session_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_type TEXT NOT NULL,
    -- 'student_session' or 'admin_action'
    student_name TEXT,
    seat_number INTEGER,
    action TEXT NOT NULL,
    -- 'visited', 'booked', 'approved', 'rejected', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user (username: admin, password: admin123)
INSERT OR IGNORE INTO admin_users (username, password) 
VALUES ('admin', 'admin123');

-- Initialize all 53 seats as available
INSERT OR IGNORE INTO seats (seat_number, status)
SELECT value, 'available' FROM (
    WITH RECURSIVE cnt(value) AS (
        SELECT 1
        UNION ALL
        SELECT value+1 FROM cnt WHERE value < 53
    )
    SELECT value FROM cnt
);

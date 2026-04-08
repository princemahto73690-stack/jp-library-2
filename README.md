# JP Library Digital Seat Management System (Version 2.0)

A sophisticated, professional, and futuristic web application for JP Library's digital seat booking system. Built with Flask, SQLite, and a stunning Glassmorphism Neon theme.

## 🎯 Features

### Student Interface
- **Welcome Animation**: Premium animated welcome screen in Hindi
- **Intent-based Navigation**: Ask students if they want to book a seat
- **53-Seat Interactive Map**: Futuristic, responsive seat selection interface
- **Smart Booking Form**: Collect student details with validation
- **Real-time Seat Status**: Color-coded seats (Green=Available, Red=Booked, Yellow=Pending)
- **Mobile Responsive**: Perfect for QR code scanning by students

### Admin Dashboard
- **Admin Login**: Secure authentication with default credentials
- **Pending Requests Tab**: Review and approve/reject booking requests
- **All Bookings Tab**: Manage all student bookings with delete functionality
- **Manual Booking Tab**: Admin can directly book seats for students
- **Seat Map Overview**: Visual representation of all seat statuses with statistics
- **Auto Approval System**: Set payment method and expiry dates (30 days)

### Database & Backend
- **SQLite Database**: Local storage, no external APIs required
- **Session Logging**: Audit trail of all student and admin actions
- **Automatic Expiry**: Seats automatically reset after 30 days
- **RESTful API**: All features exposed via clean API endpoints

## 🚀 Tech Stack

- **Backend**: Python Flask
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design**: Glassmorphism + Neon Theme (Dark Mode)
- **Styling**: Custom modern CSS with animations

## 📁 Project Structure

```
library/
├── app.py                          # Flask backend application
├── schema.sql                      # Database schema
├── requirements.txt                # Python dependencies
├── library.db                      # SQLite database (auto-created)
├── templates/
│   ├── index.html                 # Student interface
│   ├── admin.html                 # Admin dashboard
│   └── admin_login.html           # Admin login page
└── static/
    ├── css/
    │   └── style.css              # Futuristic UI styling
    └── js/
        ├── script.js              # Student interface logic
        └── admin.js               # Admin dashboard logic
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Steps

1. **Navigate to the project directory**
   ```bash
   cd c:\Users\ASUS\OneDrive\Desktop\library
   ```

2. **Create a virtual environment** (Optional but recommended)
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - Student Interface: http://localhost:5000
   - Admin Panel: http://localhost:5000/admin/login

## 🔐 Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in production:
```sql
UPDATE admin_users SET password = 'your_new_password' WHERE username = 'admin';
```

## 📋 How to Use

### For Students
1. Open the application on a mobile device or desktop
2. See the animated welcome message
3. Choose "हाँ" (Yes) to book a seat or "नहीं" (No) to exit
4. View the 53-seat map with color-coded availability
5. Click on a green (available) seat
6. Fill in your details:
   - Name
   - Village
   - Father's Name
   - Mobile Number (10 digits)
   - Class Level
7. Submit the form
8. Wait for admin approval

### For Admin
1. Login at http://localhost:5000/admin/login
2. Dashboard opens with multiple tabs:

   **Pending Tab**: 
   - View all pending seat booking requests
   - Review student details
   - Select payment method (Cash/Online)
   - Click "मंजूरी दें" (Approve) or "अस्वीकार करें" (Reject)

   **All Bookings Tab**:
   - View all confirmed bookings
   - Delete bookings (frees up the seat)
   - See expiry dates

   **Manual Booking Tab**:
   - Directly book a seat for a student
   - Enter all student details
   - Select payment method
   - Click "बुकिंग जोड़ें" (Add Booking)

   **Seat Map Tab**:
   - Visual overview of all 53 seats
   - See real-time availability
   - Statistics dashboard

## 🎨 Design Features

### Color Scheme
- **Primary Neon**: Green (#00ff88) - Available, Approvals
- **Secondary Neon**: Cyan (#00ffff) - Secondary Actions
- **Alert Neon**: Red (#ff0055) - Booked, Rejections
- **Pending Neon**: Yellow (#ffff00) - Pending Approvals
- **Dark Background**: #0a0e27 (Premium dark gradient)

### UI Elements
- **Glassmorphism**: Frosted glass effect with backdrop blur
- **Neon Glow**: Shadow effects for futuristic appearance
- **Smooth Animations**: Fade-in, pulse, glow effects
- **Responsive Design**: Perfect on mobile, tablet, and desktop

## 📱 Seat Map Layout

The 53-seat map is organized as follows:

```
           AC              Seats 1,2,3,4          AC
        53, 52, 51                            (Top Right)

Left       Boys Row        Girls Row          Right
Column    27-34, 35-42    13-19, 20-26       Column
43-50                                         5-12

                         ENTRANCE (प्रवेश)
```

## 🔗 API Endpoints

### Student API
- `GET /` - Student interface page
- `GET /api/seats` - Get all seat statuses
- `POST /api/book-seat` - Book a seat with student details
- `GET /api/seat/<seat_number>` - Get info about a specific seat

### Admin API
- `GET /admin` - Admin dashboard (login required)
- `POST /admin/login` - Admin login
- `GET /admin/logout` - Admin logout
- `GET /api/admin/pending-requests` - Get pending bookings
- `GET /api/admin/all-bookings` - Get all bookings
- `POST /api/admin/approve-booking/<booking_id>` - Approve booking
- `POST /api/admin/reject-booking/<booking_id>` - Reject booking
- `POST /api/admin/manual-book` - Manually book a seat
- `POST /api/admin/delete-booking/<booking_id>` - Delete booking

## 🗄️ Database Schema

### Tables
1. **admin_users**: Store admin credentials
2. **bookings**: Student booking requests with payment status
3. **seats**: Track status of all 53 seats
4. **session_logs**: Audit trail of all activities

All tables include timestamps for tracking.

## ⏰ Automatic Features

- **Auto Expiry**: Booked seats automatically become available after 30 days
- **Session Timeout**: Old pending requests can be manually cleared
- **Real-time Updates**: Admin dashboard and seat map refresh every 15 seconds
- **Payment Tracking**: Optional payment method recording (Cash/Online)

## 🔄 Workflow

1. **Student Books a Seat**
   - Seat status changes to "PENDING" (Yellow)
   - Request appears in Admin's "Pending" tab

2. **Admin Reviews & Approves**
   - Admin selects payment method
   - Seat status changes to "PAID" (Red)
   - 30-day expiry date is set automatically

3. **Seat Auto-expires**
   - After 30 days, seat automatically becomes "AVAILABLE" (Green)
   - Booking record is removed if refreshed

4. **Admin Can Delete Anytime**
   - Manually free up booked seats
   - Reassign or reset booking status

## 📊 Statistics

Admin can see at a glance:
- Total available seats
- Total booked seats
- Total pending approvals

## 🛠️ Customization

### Change Admin Password
Edit line 30 in `schema.sql` and re-initialize database.

### Modify Seat Layout
Edit the seat map sections in `templates/index.html` and `templates/admin.html`

### Change Colors
Update CSS variables in `static/css/style.css`:
```css
--neon-green: #00ff88;
--neon-red: #ff0055;
--neon-blue: #00ffff;
--dark-bg: #0a0e27;
```

### Add More Seats
Update `WITH RECURSIVE cnt` in `schema.sql` to generate more seats

## ⚠️ Important Notes

1. **Default Admin**: Always change default password after first setup
2. **Database Backup**: Regularly backup `library.db` for important data
3. **Production Deployment**: 
   - Set `debug=False` in app.py
   - Use a production WSGI server (Gunicorn, uWSGI)
   - Enable HTTPS
   - Use environment variables for credentials

4. **Mobile Usage**: Test on actual mobile devices before student rollout
5. **Language**: All text is in Hindi (Devanagari script). To translate, modify HTML text strings.

## 📞 Support & Troubleshooting

### Port Already in Use
If port 5000 is already in use:
```python
app.run(debug=True, host='0.0.0.0', port=8000)  # Change to any free port
```

### Database Errors
Delete `library.db` and restart app to recreate fresh database.

### Mobile Responsiveness Issues
Check browser DevTools and adjust viewport settings for testing.

## 🎉 You're All Set!

The JP Library Digital Seat Management System is ready to use. Start the Flask server and begin managing seat bookings efficiently!

---

**Version**: 2.0  
**Last Updated**: April 2026  
**License**: For JP Library Use Only

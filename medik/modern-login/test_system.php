<?php
// test_system.php
echo "<h1>System Test</h1>";

// Test 1: Session
echo "<h2>1. Session Test</h2>";
require_once 'includes/session.php';
echo "Session status: " . session_status() . " (Expected: 2 = PHP_SESSION_ACTIVE)<br>";
echo "Session ID: " . session_id() . "<br>";

// Test 2: Database Connection
echo "<h2>2. Database Connection Test</h2>";
try {
    require_once 'config/database.php';
    $db = new Database();
    $conn = $db->getConnection();
    
    if ($conn) {
        echo "✅ Database connected successfully<br>";
        
        // Test users table
        $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch();
        echo "✅ Users table exists with {$result['count']} users<br>";
        
        // Show users
        $stmt = $conn->query("SELECT id, email, full_name FROM users");
        $users = $stmt->fetchAll();
        
        echo "<h3>Current Users:</h3>";
        echo "<ul>";
        foreach ($users as $user) {
            echo "<li>ID: {$user['id']} - {$user['email']} - {$user['full_name']}</li>";
        }
        echo "</ul>";
        
    } else {
        echo "❌ Database connection failed<br>";
    }
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>";
}

// Test 3: File Structure
echo "<h2>3. File Structure Test</h2>";
$required_files = [
    'index.php',
    'register.php', 
    'dashboard.php',
    'logout.php',
    'config/database.php',
    'includes/session.php',
    'includes/login.php',
    'assets/css/style.css',
    'assets/js/script.js'
];

foreach ($required_files as $file) {
    if (file_exists($file)) {
        echo "✅ $file exists<br>";
    } else {
        echo "❌ $file missing<br>";
    }
}

// Test 4: Test Login Class
echo "<h2>4. Login Class Test</h2>";
try {
    require_once 'includes/login.php';
    $login = new Login();
    echo "✅ Login class instantiated successfully<br>";
    
    // Test with sample credentials
    $test_email = "test@example.com";
    $test_password = "123456";
    
    echo "Testing with: $test_email / $test_password<br>";
    $result = $login->loginUser($test_email, $test_password);
    
    if ($result === 'success') {
        echo "✅ Login test successful<br>";
        echo "User ID in session: " . ($_SESSION['user_id'] ?? 'Not set') . "<br>";
        
        // Cleanup
        session_unset();
    } else {
        echo "❌ Login test failed: $result<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Login class error: " . $e->getMessage() . "<br>";
}

echo "<hr>";
echo "<h3>Next Steps:</h3>";
echo "<ol>";
echo "<li><a href='index.php'>Go to Login Page</a></li>";
echo "<li><a href='register.php'>Go to Register Page</a></li>";
if (isset($_SESSION['user_id'])) {
    echo "<li><a href='dashboard.php'>Go to Dashboard</a></li>";
}
echo "</ol>";
?>
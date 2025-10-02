<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/config/database.php';

// Redirect jika tidak login
if (!isset($_SESSION['user_id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: index.php');
    exit();
}

// Session timeout (30 menit)
if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time'] > 1800)) {
    session_unset();
    session_destroy();
    header('Location: index.php?timeout=1');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <h1 class="login-title">Welcome, <?php echo htmlspecialchars($_SESSION['user_name']); ?>!</h1>
            <p class="login-subtitle">You are successfully logged in</p>
            
            <div class="user-info" style="margin:16px 0 24px;color:#4a5568;">
                <p><strong>Email:</strong> <?php echo htmlspecialchars($_SESSION['user_email']); ?></p>
                <p><strong>User ID:</strong> <?php echo (int)$_SESSION['user_id']; ?></p>
                <p><strong>Login Time:</strong> <?php echo date('Y-m-d H:i:s', $_SESSION['login_time']); ?></p>
            </div>

            <a href="logout.php" class="login-btn" style="text-decoration: none; text-align: center; display: block;">Logout</a>
        </div>
    </div>
</body>
</html>
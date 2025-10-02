<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/config/database.php';

// Redirect jika sudah login
if (isset($_SESSION['user_id']) && isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header('Location: dashboard.php');
    exit();
}

$success_message = null;
$error_message = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register'])) {
    $full_name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';

    if ($full_name === '' || $email === '' || $password === '' || $confirm_password === '') {
        $error_message = 'Please fill in all fields';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error_message = 'Invalid email format';
    } elseif (strlen($password) < 6) {
        $error_message = 'Password must be at least 6 characters';
    } elseif ($password !== $confirm_password) {
        $error_message = 'Passwords do not match';
    } else {
        try {
            $db = new Database();
            $conn = $db->getConnection();
            
            // Check if email exists
            $stmt = $conn->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
            $stmt->execute([':email' => $email]);
            
            if ($stmt->fetch()) {
                $error_message = 'Email is already registered';
            } else {
                // Create new user
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $ins = $conn->prepare('INSERT INTO users (email, password, full_name) VALUES (:email, :password, :full_name)');
                $ins->execute([
                    ':email' => $email, 
                    ':password' => $hash, 
                    ':full_name' => $full_name
                ]);
                
                $success_message = 'Registration successful. You can now sign in.';
                
                // Clear form
                $_POST['full_name'] = '';
                $_POST['email'] = '';
            }
        } catch (PDOException $e) {
            error_log("Registration error: " . $e->getMessage());
            $error_message = 'System error. Please try again later.';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1 class="login-title">Create your account</h1>
                <p class="login-subtitle">Join us to get started</p>
            </div>

            <?php if (!empty($error_message)): ?>
                <div class="alert error"><?php echo htmlspecialchars($error_message); ?></div>
            <?php endif; ?>
            <?php if (!empty($success_message)): ?>
                <div class="alert" style="background:#C6F6D5;color:#276749;border:1px solid #9AE6B4;border-radius:10px;">
                    <?php echo htmlspecialchars($success_message); ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="" class="login-form" novalidate>
                <input type="hidden" name="register" value="1">

                <div class="form-group">
                    <label for="full_name" class="form-label">Full name</label>
                    <input type="text" id="full_name" name="full_name" class="form-input" required placeholder="Your full name" value="<?php echo htmlspecialchars($_POST['full_name'] ?? ''); ?>">
                </div>

                <div class="form-group">
                    <label for="email" class="form-label">Mail id</label>
                    <input type="email" id="email" name="email" class="form-input" required placeholder="Enter your email" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" class="form-input" required placeholder="Create a password">
                </div>

                <div class="form-group">
                    <label for="confirm_password" class="form-label">Confirm password</label>
                    <input type="password" id="confirm_password" name="confirm_password" class="form-input" required placeholder="Confirm your password">
                </div>

                <button type="submit" class="login-btn">Register</button>
            </form>

            <div class="register-link">
                <p>Already have an account? <a href="index.php">Sign in</a></p>
            </div>
        </div>
    </div>
</body>
</html>

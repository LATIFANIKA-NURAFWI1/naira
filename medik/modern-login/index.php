<?php




require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/config/database.php';

if (isset($_SESSION['user_id']) && isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header('Location: dashboard.php');
    exit();
}

$error_message = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    require_once __DIR__ . '/includes/login.php';
    
    try {
        $login = new Login();
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        $result = $login->loginUser($email, $password);
        
        if ($result === 'success') {
            header('Location: dashboard.php');
            exit();
        } else {
            $error_message = $result;
        }
    } catch (Exception $e) {
        $error_message = "System error. Please try again later.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Your Account</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1 class="login-title">Let's sign you in</h1>
                <p class="login-subtitle">Hello welcome back to your account</p>
            </div>

            <?php if (!empty($error_message)): ?>
                <div class="alert error"><?php echo htmlspecialchars($error_message); ?></div>
            <?php endif; ?>

            <form method="POST" action="" class="login-form" novalidate>
                <input type="hidden" name="login" value="1">
                
                <div class="form-group">
                    <label for="email" class="form-label">Mail id</label>
                    <input type="email" id="email" name="email" class="form-input" required placeholder="Enter your email">
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" class="form-input" required placeholder="Enter your password">
                </div>

                <div class="form-options">
                    <a href="#" class="forgot-link">Forget password?</a>
                </div>

                <button type="submit" class="login-btn">Sign in now</button>
            </form>

            <div class="divider">
                <span>or sign in with google</span>
            </div>

            <button class="google-btn" type="button" aria-label="Sign in with Google">
                <svg class="google-icon" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#EA4335" d="M533.5 278.4c0-18.5-1.7-36.4-4.9-53.8H272.1v101.9h146.9c-6.3 34.1-25 63.1-53.3 82.6v68h86.1c50.4-46.5 81.7-115.1 81.7-198.7z"/>
                    <path fill="#34A853" d="M272.1 544.3c72.6 0 133.6-24 178.2-65.2l-86.1-68c-23.9 16.1-54.7 25.7-92.1 25.7-70.8 0-130.8-47.8-152.4-112.1H31.6v70.4c44.2 87.8 135.3 149.2 240.5 149.2z"/>
                    <path fill="#4285F4" d="M119.7 324.7c-10.4-30.9-10.4-64 0-94.9V159.4H31.6c-41.7 83.1-41.7 182.4 0 265.5l88.1-70.2z"/>
                    <path fill="#FBBC05" d="M272.1 107.7c39.5-.6 77.2 14 106 40.9l79.2-79.2C405.6 24.9 344.6 0 272.1 0 166.9 0 75.8 61.4 31.6 149.2l88.1 70.4c21.6-64.3 81.6-112 152.4-112z"/>
                </svg>
                <span>Google</span>
            </button>

            <div class="register-link">
                <p>Don't have an account? <a href="register.php">Register</a></p>
            </div>
        </div>
    </div>

    <script src="assets/js/script.js"></script>
</body>
</html>

<?php
require_once __DIR__ . '/../config/database.php';

class Login {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        
        if (!$this->conn) {
            throw new Exception("Database connection failed");
        }
    }
public function loginUser($email, $password) {
        // Validasi input
        if (empty($email) || empty($password)) {
            return "Please fill in all fields";
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return "Invalid email format";
        }

    try {
            $query = "SELECT id, email, password, full_name FROM users WHERE email = :email LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":email", $email, PDO::PARAM_STR);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                if (password_verify($password, $user['password'])) {
                    // Login berhasil
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['user_email'] = $user['email'];
                    $_SESSION['user_name'] = $user['full_name'] ?: $user['email'];
                    $_SESSION['logged_in'] = true;
                    $_SESSION['login_time'] = time();
                    
                    return "success";
                } else {
                    return "Invalid email or password";
                }
            } else {
                return "Invalid email or password";
            }
    } catch (PDOException $e) {
            error_log("Login error: " . $e->getMessage());
            return "System error. Please try again later.";
        }
    }
}
?>


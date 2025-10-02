<?php
class Database {
    private $host = "localhost";
    private $db_name = "user_auth";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            // Jangan tampilkan error detail ke user
            error_log("Database connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed. Please try again later.");
        }
        return $this->conn;
    }
}
?>
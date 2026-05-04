import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import styles from "../styles/services.module.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data?.error || "Login failed");
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data.admin.email);
      navigate("/admin/dashboard");
    } catch (error) {
      alert(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className={styles.wrapper}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h2>Admin Login</h2>
            <p>Secure access to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="myadmin@gmail.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className={styles.btn} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login to Dashboard"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
};

export default Login;
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import styles from "../styles/admin.module.css";

const API_BASE_URL = "http://localhost:3000/api/admin";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmount, setWalletAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const adminToken = localStorage.getItem("adminToken");
  const adminEmail = localStorage.getItem("adminEmail");

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`
  }), [adminToken]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [transactionsResponse, walletResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/transactions`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/wallet`, { headers: authHeaders })
      ]);

      if (transactionsResponse.status === 401 || walletResponse.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");
        navigate("/admin/login");
        return;
      }

      const transactionsData = await transactionsResponse.json();
      const walletData = await walletResponse.json();

      setTransactions(transactionsData.transactions || []);
      setWalletBalance(walletData.balance || 0);
    } catch (error) {
      alert("Could not load admin dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const updateWallet = async (action) => {
    const amount = Number(walletAmount);
    if (!amount || amount <= 0) {
      alert("Enter a valid amount greater than zero.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wallet/${action}`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Wallet request failed");
      }

      setWalletBalance(data.balance);
      setWalletAmount("");
    } catch (error) {
      alert(error.message || "Wallet update failed");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: authHeaders
      });
    } catch (error) {
      // Logout on the client even if the server request fails.
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");
      navigate("/admin/login");
    }
  };

  return (
    <>
      <Header />
      <main className={styles.wrapper}>
        <section className={styles.topBar}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, {adminEmail || "Administrator"}</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </section>

        <section className={styles.walletCard}>
          <h2>Wallet</h2>
          <p className={styles.balance}>Balance: ₦{walletBalance.toLocaleString()}</p>
          <div className={styles.walletActions}>
            <input
              type="number"
              min="1"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <button onClick={() => updateWallet("deposit")}>Deposit</button>
            <button onClick={() => updateWallet("withdraw")} className={styles.withdrawBtn}>Withdraw</button>
          </div>
        </section>

        <section className={styles.tableSection}>
          <h2>Purchases</h2>
          {isLoading ? (
            <p>Loading transactions...</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Phone</th>
                    <th>Item</th>
                    <th>Amount Paid</th>
                    <th>Exam Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={styles.empty}>No transactions yet.</td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.phone}</td>
                        <td>{transaction.item}</td>
                        <td>₦{Number(transaction.amount || 0).toLocaleString()}</td>
                        <td>{transaction.item === "exam_pin" ? transaction.quantity : "-"}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[transaction.status] || ""}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default AdminDashboard;

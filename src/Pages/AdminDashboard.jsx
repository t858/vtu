import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import styles from "../styles/admin.module.css";
import { API_BASE_URL as BASE_URL } from "../config/api";

const API_BASE_URL = `${BASE_URL}/api/admin`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmount, setWalletAmount] = useState("");
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    totalPurchases: 0,
    uniqueBuyers: 0,
    failedPurchases: 0,
    pendingPurchases: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedRef, setCopiedRef] = useState(null);

  const adminToken = localStorage.getItem("adminToken");
  const adminEmail = localStorage.getItem("adminEmail");

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`
  }), [adminToken]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [transactionsResponse, walletResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/transactions`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/wallet`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/stats`, { headers: authHeaders })
      ]);

      if (transactionsResponse.status === 401 || walletResponse.status === 401 || statsResponse.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");
        navigate("/admin/login");
        return;
      }

      const transactionsData = await transactionsResponse.json();
      const walletData = await walletResponse.json();
      const statsData = await statsResponse.json();

      setTransactions(transactionsData.transactions || []);
      setWalletBalance(walletData.balance || 0);
      setStats(statsData || {});
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
      // Logout client side regardless
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");
      navigate("/admin/login");
    }
  };

  const copyRef = (ref) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (tx.email && tx.email.toLowerCase().includes(term)) ||
      (tx.phone && tx.phone.toLowerCase().includes(term)) ||
      (tx.reference && tx.reference.toLowerCase().includes(term)) ||
      (tx.item && tx.item.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <Header />
      <main className={styles.wrapper}>
        {/* Top Header */}
        <section className={styles.topBar}>
          <div>
            <h1>Admin Operations & Analytics</h1>
            <p>Signed in as: <strong>{adminEmail || "Administrator"}</strong></p>
          </div>
          <div className={styles.topActions}>
            <button
              className={styles.refreshBtn}
              onClick={fetchDashboardData}
              disabled={isLoading}
              title="Refresh dashboard metrics"
            >
              <i className={`fa-solid fa-arrows-rotate ${isLoading ? "fa-spin" : ""}`}></i>
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
            </button>
          </div>
        </section>

        {/* Analytics KPI Cards */}
        <section className={styles.statsGrid}>
          {/* Total Visitors */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Site Visitors</span>
              <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
            <div className={styles.statValue}>{(stats.totalVisits || 0).toLocaleString()}</div>
            <div className={styles.statSub}>
              {stats.uniqueVisitors || 0} unique IP visitor{stats.uniqueVisitors === 1 ? '' : 's'}
            </div>
          </div>

          {/* Total Purchases */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Purchased Services</span>
              <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                <i className="fa-solid fa-bag-shopping"></i>
              </div>
            </div>
            <div className={styles.statValue}>{(stats.totalPurchases || 0).toLocaleString()}</div>
            <div className={styles.statSub}>
              By {stats.uniqueBuyers || 0} paying customer{stats.uniqueBuyers === 1 ? '' : 's'}
            </div>
          </div>

          {/* Total Revenue */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Total Revenue</span>
              <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                <i className="fa-solid fa-money-bill-wave"></i>
              </div>
            </div>
            <div className={styles.statValue}>₦{(stats.totalRevenue || 0).toLocaleString()}</div>
            <div className={styles.statSub}>From verified transactions</div>
          </div>

          {/* Failed Purchases */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>Failed Purchases</span>
              <div className={`${styles.statIcon} ${styles.iconRed}`}>
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>
            </div>
            <div className={styles.statValue}>{(stats.failedPurchases || 0).toLocaleString()}</div>
            <div className={styles.statSub}>
              {stats.pendingPurchases || 0} pending payment
            </div>
          </div>
        </section>

        {/* Wallet Balance & Adjustments */}
        <section className={styles.walletCard}>
          <div className={styles.walletHeader}>
            <h2>
              <i className="fa-solid fa-wallet" style={{ color: "var(--primary-color)" }}></i>
              Operations Wallet
            </h2>
            <div className={styles.balance}>Balance: ₦{walletBalance.toLocaleString()}</div>
          </div>
          <div className={styles.walletActions}>
            <input
              type="number"
              min="1"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              placeholder="Enter amount (₦)"
            />
            <button className={styles.depositBtn} onClick={() => updateWallet("deposit")}>
              <i className="fa-solid fa-plus"></i> Deposit
            </button>
            <button className={styles.withdrawBtn} onClick={() => updateWallet("withdraw")}>
              <i className="fa-solid fa-minus"></i> Withdraw
            </button>
          </div>
        </section>

        {/* Detailed Transactions Section */}
        <section className={styles.tableSection}>
          <div className={styles.tableToolbar}>
            <h2 className={styles.tableTitle}>Purchase Records & Delivery Log</h2>
            <div className={styles.tableControls}>
              <input
                type="text"
                placeholder="Search email, phone, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Statuses ({transactions.length})</option>
                <option value="successful">Successful</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className={styles.empty}>
              <i className="fa-solid fa-spinner fa-spin"></i> Loading transactions...
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Purchased Service</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th>Delivery Outcome / Failure Reason</th>
                    <th>Reference & Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.empty}>
                        {transactions.length === 0
                          ? "No transactions recorded yet."
                          : "No transactions match your search filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        {/* Customer Info */}
                        <td>
                          <div className={styles.customerCol}>
                            <span className={styles.customerEmail}>{tx.email || "Guest"}</span>
                            <span className={styles.customerPhone}>
                              <i className="fa-solid fa-phone" style={{ fontSize: "0.7rem", marginRight: "3px" }}></i>
                              {tx.phone || "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* What was purchased */}
                        <td>
                          <div className={styles.itemCol}>
                            <span className={styles.itemBadge}>{tx.item}</span>
                            <span className={styles.itemMeta}>
                              {tx.type === "exam_pin"
                                ? `Quantity: ${tx.quantity || 1} pin(s)`
                                : `Target: ${tx.phone}`}
                            </span>
                          </div>
                        </td>

                        {/* How much paid */}
                        <td className={styles.amountCol}>
                          ₦{Number(tx.amount || 0).toLocaleString()}
                        </td>

                        {/* Status (Success or Failed) */}
                        <td>
                          <span className={`${styles.badge} ${styles[tx.status] || ""}`}>
                            {tx.status === "successful" && <i className="fa-solid fa-check"></i>}
                            {tx.status === "failed" && <i className="fa-solid fa-xmark"></i>}
                            {tx.status === "pending" && <i className="fa-solid fa-clock"></i>}
                            {tx.status}
                          </span>
                        </td>

                        {/* Failure Reason if failed / Outcome */}
                        <td className={styles.reasonCol}>
                          {tx.status === "failed" ? (
                            <span className={styles.reasonFailed}>
                              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "4px" }}></i>
                              {tx.failureReason || "Payment declined or cancelled by bank/user"}
                            </span>
                          ) : tx.status === "successful" ? (
                            <span className={styles.reasonSuccess}>
                              <i className="fa-solid fa-circle-check"></i>
                              Delivered successfully
                            </span>
                          ) : (
                            <span className={styles.reasonPending}>
                              <i className="fa-solid fa-hourglass-half" style={{ marginRight: "4px" }}></i>
                              Awaiting checkout completion
                            </span>
                          )}
                        </td>

                        {/* Reference & Date */}
                        <td>
                          <div className={styles.refCol}>
                            <span>{tx.reference?.slice(0, 14)}...</span>
                            <button
                              type="button"
                              className={styles.copyRefBtn}
                              title="Copy transaction reference"
                              onClick={() => copyRef(tx.reference)}
                            >
                              <i className={copiedRef === tx.reference ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                            </button>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--grey)" }}>
                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

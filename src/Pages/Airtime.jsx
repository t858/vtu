import Header from "../components/Header"
import styles from '../styles/services.module.css'
import { useState } from 'react'

const Airtime = ({ menu, toggleMenu, isDarkMode, toggleTheme }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    network: 'MTN',
    phone: '',
    amount: '',
    email: '',
    plans: 'airtime'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/transactions/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          amount: Number(formData.amount),
          metadata: {
            type: formData.plans,
            network: formData.network,
            phone: formData.phone,
            plan: formData.plans
          }
        })
      });

      const data = await response.json();
      const paystackUrl = data?.data?.authorization_url;

      if (!response.ok || !paystackUrl) {
        throw new Error(data?.error || 'Could not initialize payment');
      }

      window.location.href = paystackUrl;
    } catch (error) {
      alert(error.message || 'Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <>
      <Header menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <main className={styles.wrapper}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h2>Buy Airtime</h2>
            <p>Instant recharge/Data subscription here</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="network">Network Provider</label>
              <select
                id="network"
                name="network"
                value={formData.network}
                onChange={handleChange}
                required
              >
                <option value="MTN">MTN</option>
                <option value="Airtel">Airtel</option>
                <option value="Glo">Glo</option>
                <option value="9mobile">9mobile</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="08012345678"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="network">Airtime/Data</label>
              <select
                id="plans"
                name="plans"
                value={formData.plans}
                onChange={handleChange}
                placeholder="Select Plan"
                required
              >
                <option value="airtime">Airtime</option>
                <option value="data">Data</option>
              </select>
            </div>


            <div className={styles.formGroup}>
              <label htmlFor="amount">Amount (₦)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                min="50"
                placeholder="100"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address (For Receipt)</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? (
                <>Connecting to Paystack... <i className="fa-solid fa-spinner fa-spin"></i></>
              ) : (
                <>Proceed to Pay <i className="fa-solid fa-lock"></i></>
              )}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}

export default Airtime

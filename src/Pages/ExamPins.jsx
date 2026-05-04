import Header from "../components/Header"
import styles from '../styles/services.module.css'
import { useState } from 'react'

const examPrices = {
  'WAEC': 4000,
  'NECO': 2200,
  'NABTEB': 1300,
  'JAMB': 7190
};

const ExamPins = ({ menu, toggleMenu, isDarkMode, toggleTheme }) => {
  const [formData, setFormData] = useState({
    examType: 'WAEC',
    quantity: 1,
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const totalPrice = examPrices[formData.examType] * formData.quantity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/transactions/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          amount: Number(totalPrice),
          metadata: {
            type: 'exam_pin',
            examType: formData.examType,
            quantity: Number(formData.quantity),
            phone: formData.phone
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
    }
  };

  return (
    <>
      <Header menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <main className={styles.wrapper}>
        <div className={styles.formContainer}>
          <div className={styles.header}>
            <h2>Buy Exam Pins</h2>
            <p>Get your result checker pins instantly</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="examType">Select Examination</label>
              <select 
                id="examType"
                name="examType" 
                value={formData.examType} 
                onChange={handleChange}
                required
              >
                <option value="WAEC">WAEC Result Checker PIN (₦4,000)</option>
                <option value="NECO">NECO Result Checker TOKEN (₦2,200)</option>
                <option value="NABTEB">NABTEB Result Checker PIN (₦1,300)</option>
                <option value="JAMB">JAMB Registration PIN (₦7,190)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="quantity">Quantity</label>
              <input 
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max="10"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address (To Receive PIN)</label>
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

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number (Optional Backup)</label>
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

            <div className={styles.priceDisplay}>
              <p>Total to Pay: ₦{totalPrice.toLocaleString()}</p>
            </div>

            <button type="submit" className={styles.btn}>
              Proceed to Pay <i className="fa-solid fa-lock"></i>
            </button>
          </form>
        </div>
      </main>
    </>
  )
}

export default ExamPins

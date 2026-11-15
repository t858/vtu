import Header from "../components/Header"
import styles from '../styles/services.module.css'
import { useState, useMemo } from 'react'
import { API_BASE_URL } from '../config/api'

// Active data plans based on VTU Africa specifications
const DATA_PLANS = {
  MTN: [
    { label: 'MTN SME 500MB (7-Days)', service: 'MTNSME', plan: '500W', price: 350 },
    { label: 'MTN SME 1GB (30-Days)', service: 'MTNSME', plan: '1000', price: 800 },
    { label: 'MTN SME 2GB (30-Days)', service: 'MTNSME', plan: '2000', price: 1500 },
    { label: 'MTN SME 3GB (30-Days)', service: 'MTNSME', plan: '3000', price: 1850 },
    { label: 'MTN SME 5GB (7-Days)', service: 'MTNSME', plan: '5000W', price: 1950 },
    { label: 'MTN SME 6GB (7-Days)', service: 'MTNSME', plan: '6000W', price: 2600 },
    { label: 'MTN SME 10GB (30-Days)', service: 'MTNSME', plan: '10000', price: 4600 }
  ],
  Airtel: [
    { label: 'Airtel SME 1GB (1-Day)', service: 'AIRTELSME', plan: '1000D', price: 400 },
    { label: 'Airtel SME 3GB (7-Days)', service: 'AIRTELSME', plan: '3000W', price: 1150 },
    { label: 'Airtel SME 7GB (7-Days)', service: 'AIRTELSME', plan: '7000W', price: 2150 },
    { label: 'Airtel SME 4GB (30-Days)', service: 'AIRTELSME', plan: '4000', price: 2600 },
    { label: 'Airtel SME 10GB (30-Days)', service: 'AIRTELSME', plan: '10000', price: 3300 },
    { label: 'Airtel SME 13GB (30-Days)', service: 'AIRTELSME', plan: '13000', price: 5200 }
  ],
  Glo: [
    { label: 'Glo Corporate 500MB (30-Days)', service: 'GLOCG', plan: '500', price: 250 },
    { label: 'Glo Corporate 1GB (30-Days)', service: 'GLOCG', plan: '1000', price: 450 },
    { label: 'Glo Corporate 2GB (30-Days)', service: 'GLOCG', plan: '2000', price: 900 },
    { label: 'Glo Corporate 3GB (30-Days)', service: 'GLOCG', plan: '3000', price: 1350 },
    { label: 'Glo Corporate 5GB (30-Days)', service: 'GLOCG', plan: '5000', price: 2200 },
    { label: 'Glo Corporate 10GB (30-Days)', service: 'GLOCG', plan: '10000', price: 4300 }
  ],
  '9mobile': [
    { label: '9mobile SME 500MB (30-Days)', service: '9MOBILESME', plan: '500', price: 180 },
    { label: '9mobile CG 1GB (30-Days)', service: '9MOBILECG', plan: '1000', price: 350 },
    { label: '9mobile CG 2GB (30-Days)', service: '9MOBILECG', plan: '2000', price: 650 },
    { label: '9mobile SME 3.5GB (30-Days)', service: '9MOBILESME', plan: '3500', price: 1000 },
    { label: '9mobile SME 7GB (30-Days)', service: '9MOBILESME', plan: '7000', price: 1900 },
    { label: '9mobile SME 15GB (30-Days)', service: '9MOBILESME', plan: '15000', price: 3350 }
  ]
};

const Airtime = ({ menu, toggleMenu, isDarkMode, toggleTheme }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    network: 'MTN',
    phone: '',
    amount: '',
    email: '',
    plans: 'airtime',
    selectedDataPlanIndex: 0
  });

  const currentDataPlans = useMemo(() => {
    return DATA_PLANS[formData.network] || DATA_PLANS.MTN;
  }, [formData.network]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'network') {
      const plansForNetwork = DATA_PLANS[value] || [];
      const defaultPlan = plansForNetwork[0];
      setFormData(prev => ({
        ...prev,
        network: value,
        selectedDataPlanIndex: 0,
        amount: prev.plans === 'data' && defaultPlan ? String(defaultPlan.price) : prev.amount
      }));
    } else if (name === 'plans') {
      const defaultPlan = currentDataPlans[0];
      setFormData(prev => ({
        ...prev,
        plans: value,
        amount: value === 'data' && defaultPlan ? String(defaultPlan.price) : ''
      }));
    } else if (name === 'selectedDataPlanIndex') {
      const planIdx = Number(value);
      const chosen = currentDataPlans[planIdx];
      setFormData(prev => ({
        ...prev,
        selectedDataPlanIndex: planIdx,
        amount: chosen ? String(chosen.price) : prev.amount
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isData = formData.plans === 'data';
    const chosenPlan = isData ? currentDataPlans[formData.selectedDataPlanIndex] : null;
    const finalAmount = isData && chosenPlan ? chosenPlan.price : Number(formData.amount);

    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          amount: finalAmount,
          metadata: {
            type: formData.plans,
            network: formData.network,
            phone: formData.phone,
            service: isData && chosenPlan ? chosenPlan.service : undefined,
            dataPlan: isData && chosenPlan ? chosenPlan.plan : undefined,
            planName: isData && chosenPlan ? chosenPlan.label : 'Airtime VTU'
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
            <h2>{formData.plans === 'data' ? 'Buy Mobile Data' : 'Buy Airtime'}</h2>
            <p>Instant recharge and automated VTU delivery</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="plans">Service Type</label>
              <select
                id="plans"
                name="plans"
                value={formData.plans}
                onChange={handleChange}
                required
              >
                <option value="airtime">Airtime VTU</option>
                <option value="data">Data Bundle</option>
              </select>
            </div>

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

            {formData.plans === 'data' ? (
              <div className={styles.formGroup}>
                <label htmlFor="selectedDataPlanIndex">Select Data Plan</label>
                <select
                  id="selectedDataPlanIndex"
                  name="selectedDataPlanIndex"
                  value={formData.selectedDataPlanIndex}
                  onChange={handleChange}
                  required
                >
                  {currentDataPlans.map((p, index) => (
                    <option key={`${p.service}-${p.plan}`} value={index}>
                      {p.label} - ₦{p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label htmlFor="amount">Recharge Amount (₦)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  min="50"
                  max="50000"
                  placeholder="e.g. 500"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

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
                <>
                  Pay ₦{formData.plans === 'data' 
                    ? (currentDataPlans[formData.selectedDataPlanIndex]?.price || 0).toLocaleString() 
                    : (Number(formData.amount) || 0).toLocaleString()} <i className="fa-solid fa-lock"></i>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}

export default Airtime

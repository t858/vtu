import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import styles from '../styles/paymentsuccess.module.css';

const EXAM_PORTALS = {
  WAEC: {
    name: 'WAEC Direct Portal',
    url: 'https://www.waecdirect.org',
    instructions: 'Visit the WAEC portal, select your Exam Year and Exam Type, enter your Examination Number, then input your Card Serial Number and PIN.'
  },
  NECO: {
    name: 'NECO Results Portal',
    url: 'https://result.neco.gov.ng',
    instructions: 'Visit the NECO Result portal, select your Exam Year and Exam Type, enter your Token and Registration Number, then click Check Result.'
  },
  NABTEB: {
    name: 'NABTEB Results Portal',
    url: 'https://eworld.nabtebnigeria.org',
    instructions: 'Visit the NABTEB e-World portal, enter your Candidate Number, Exam Type, Year, and the PIN and Serial Number provided.'
  },
  JAMB: {
    name: 'JAMB e-Facility Portal',
    url: 'https://efacility.jamb.gov.ng',
    instructions: 'Visit the JAMB portal or present this PIN at an accredited CBT registration centre to proceed with your registration or result printing.'
  }
};

const PaymentSuccess = ({ menu, toggleMenu, isDarkMode, toggleTheme }) => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [order, setOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const reference = searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setErrorMessage('No payment reference found. Please ensure you completed the transaction through Paystack.');
      return;
    }

    const verifyTransaction = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/transactions/verify/${encodeURIComponent(reference)}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setOrder(result.data);
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(result.error || result.message || 'Payment verification could not be completed.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('Failed to connect to the verification server. Please check your network or try again.');
      }
    };

    verifyTransaction();
  }, [reference]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const isExam = order?.type === 'exam_pin' || order?.metadata?.type === 'exam_pin';
  const isAirtime = order?.type === 'airtime' || order?.metadata?.type === 'airtime';
  const examType = order?.metadata?.examType || 'Exam';
  const pins = order?.fulfillment?.pins || [];
  const portalInfo = EXAM_PORTALS[examType];

  return (
    <>
      <Header menu={menu} toggleMenu={toggleMenu} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      <main className={styles.wrapper}>
        <div className={styles.card}>
          {status === 'loading' && (
            <div className={styles.spinnerContainer}>
              <div className={styles.spinner}></div>
              <h2>Verifying Payment...</h2>
              <p className={styles.subtitle}>
                Please hold on while we confirm your transaction with Paystack and generate your service.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className={`${styles.statusIcon} ${styles.error}`}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h2 className={styles.title}>Payment Verification Failed</h2>
              <p className={styles.subtitle}>{errorMessage}</p>

              {reference && (
                <div className={styles.receiptSummary}>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Transaction Reference</span>
                    <span className={styles.receiptValue}>{reference}</span>
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                <Link to="/airtime">
                  <button className={styles.btnSecondary}>Buy Airtime</button>
                </Link>
                <Link to="/exam-pins">
                  <button className={styles.btnSecondary}>Buy Exam Pins</button>
                </Link>
                <Link to="/">
                  <button className={styles.btnPrimary}>Return Home</button>
                </Link>
              </div>
            </div>
          )}

          {status === 'success' && order && (
            <div>
              <div className={`${styles.statusIcon} ${styles.success}`}>
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 className={styles.title}>Payment Successful!</h2>
              <p className={styles.subtitle}>
                Your transaction has been verified and your purchase is ready.
              </p>

              {/* Delivery Banner */}
              {isAirtime && (
                <div className={styles.deliveryBanner}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>
                    {order?.fulfillment?.message || `₦${order?.amount?.toLocaleString()} ${order?.metadata?.network} Airtime sent to ${order?.metadata?.phone}`}
                  </span>
                </div>
              )}

              {/* Exam Pins Display */}
              {isExam && pins.length > 0 && (
                <div className={styles.pinsSection}>
                  <div className={styles.pinsHeading}>
                    <i className="fa-solid fa-ticket"></i>
                    <span>Your {examType} Pin Token{pins.length > 1 ? 's' : ''} ({pins.length})</span>
                  </div>

                  <div className={styles.pinsGrid}>
                    {pins.map((item, index) => (
                      <div key={index} className={styles.pinCard}>
                        {item.serial && (
                          <div className={styles.pinItem}>
                            <span className={styles.pinKey}>Serial Number:</span>
                            <div className={styles.pinValGroup}>
                              <span className={styles.pinCode}>{item.serial}</span>
                              <button
                                type="button"
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(item.serial, `serial-${index}`)}
                              >
                                {copiedKey === `serial-${index}` ? (
                                  <>
                                    <i className="fa-solid fa-check"></i> Copied
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-regular fa-copy"></i> Copy
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className={styles.pinItem}>
                          <span className={styles.pinKey}>{examType === 'NECO' ? 'Token' : 'PIN'}:</span>
                          <div className={styles.pinValGroup}>
                            <span className={styles.pinCode}>{item.pin}</span>
                            <button
                              type="button"
                              className={styles.copyBtn}
                              onClick={() => copyToClipboard(item.pin, `pin-${index}`)}
                            >
                              {copiedKey === `pin-${index}` ? (
                                <>
                                  <i className="fa-solid fa-check"></i> Copied
                                </>
                              ) : (
                                <>
                                  <i className="fa-regular fa-copy"></i> Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {portalInfo && (
                    <div className={styles.instructionsBox}>
                      <strong>How to use your PIN:</strong>
                      <p>{portalInfo.instructions}</p>
                      <p style={{ marginTop: '0.4rem' }}>
                        Official Portal:{' '}
                        <a href={portalInfo.url} target="_blank" rel="noopener noreferrer">
                          {portalInfo.name} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.75rem' }}></i>
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Receipt Breakdown */}
              <div className={styles.receiptSummary}>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Transaction Reference:</span>
                  <div className={styles.pinValGroup}>
                    <span className={styles.receiptValue}>{order.reference}</span>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(order.reference, 'ref')}
                    >
                      {copiedKey === 'ref' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Amount Paid:</span>
                  <span className={styles.receiptValue}>₦{order.amount?.toLocaleString()}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Customer Email:</span>
                  <span className={styles.receiptValue}>{order.email}</span>
                </div>
                {order?.metadata?.phone && (
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Recipient Phone:</span>
                    <span className={styles.receiptValue}>{order.metadata.phone}</span>
                  </div>
                )}
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Status:</span>
                  <span className={styles.receiptValue} style={{ color: '#27ae60', textTransform: 'capitalize' }}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => window.print()}
                >
                  <i className="fa-solid fa-print"></i> Print Receipt
                </button>
                <Link to={isExam ? '/exam-pins' : '/airtime'}>
                  <button className={styles.btnSecondary}>
                    Buy More
                  </button>
                </Link>
                <Link to="/">
                  <button className={styles.btnPrimary}>
                    Return Home
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default PaymentSuccess;

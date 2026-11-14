import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:8080/api/expenses';
const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping'];

const CATEGORY_CONFIG = [
  { name: 'Food', icon: '🍔', fillClass: 'cat-mini-food' },
  { name: 'Travel', icon: '✈️', fillClass: 'cat-mini-travel' },
  { name: 'Bills', icon: '💡', fillClass: 'cat-mini-bills' },
  { name: 'Shopping', icon: '🛍️', fillClass: 'cat-mini-shopping' },
];

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('Food');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch all transactions from backend on mount
  useEffect(() => {
    let isMounted = true;

    const loadInitialExpenses = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (isMounted) {
          setExpenses(data);
          setError(null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (isMounted) {
          setError(
            'Unable to connect to Spring Boot backend at http://localhost:8080/api/expenses. The backend server might still be starting up.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialExpenses();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual retry function for user clicks
  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(
        'Unable to connect to Spring Boot backend at http://localhost:8080/api/expenses. The backend server might still be starting up.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Entry
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setActionError(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setActionError('Please enter a title.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setActionError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          category,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add expense. Status: ${response.status}`);
      }

      const created = await response.json();
      setExpenses((prev) => [...prev, created]);
      // Reset form fields
      setTitle('');
      setAmount('');
      setType('EXPENSE');
      setCategory('Food');
    } catch (err) {
      console.error('Add expense error:', err);
      setActionError('Failed to save entry to backend. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Entry
  const handleDelete = async (id) => {
    setActionError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }

      // Update UI immediately
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setActionError('Failed to delete transaction. Please check backend connection.');
    }
  };

  // Summary Calculations
  const totalBudget = expenses
    .filter((item) => item.type === 'BUDGET')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalSpent = expenses
    .filter((item) => item.type === 'EXPENSE')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const remainingBalance = totalBudget - totalSpent;

  // 1. Progress Bar Calculations
  const spentPercentage =
    totalBudget > 0
      ? (totalSpent / totalBudget) * 100
      : totalSpent > 0
      ? 100
      : 0;

  const isOverBudget = totalSpent > totalBudget && totalBudget > 0;
  const progressStatus = isOverBudget
    ? 'danger'
    : spentPercentage >= 85
    ? 'warning'
    : 'normal';

  // 2. Category Breakdown Summary
  const categoryBreakdown = CATEGORY_CONFIG.map((cat) => {
    const total = expenses
      .filter(
        (item) =>
          item.type === 'EXPENSE' &&
          item.category?.toLowerCase() === cat.name.toLowerCase()
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const percent = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
    return {
      ...cat,
      total,
      percent,
    };
  });

  // Filtered Transactions
  const filteredExpenses =
    selectedCategory === 'All'
      ? expenses
      : expenses.filter(
          (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase()
        );

  // Currency Formatter (₹)
  const formatINR = (val) => {
    return (
      '₹' +
      Number(val || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'food':
        return 'badge-cat-food';
      case 'travel':
        return 'badge-cat-travel';
      case 'bills':
        return 'badge-cat-bills';
      case 'shopping':
        return 'badge-cat-shopping';
      default:
        return 'badge-cat-default';
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-title-group">
          <h1>Budget & Expense Tracker</h1>
          <p className="app-subtitle">Spring Boot + React Financial Dashboard</p>
        </div>
        <div className="backend-status-pill">
          <span className={`status-dot ${error ? 'offline' : 'online'}`}></span>
          <span>{error ? 'Backend Offline' : 'Connected to :8080'}</span>
        </div>
      </header>

      {/* Action Error Notification */}
      {actionError && (
        <div className="action-alert">
          <span>{actionError}</span>
          <button className="btn-dismiss" onClick={() => setActionError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="summary-grid">
        <div className="summary-card budget">
          <div className="summary-card-header">
            <span className="summary-label">Total Budget</span>
            <span className="summary-icon">🎯</span>
          </div>
          <div className="summary-amount">{formatINR(totalBudget)}</div>
        </div>

        <div className="summary-card expense">
          <div className="summary-card-header">
            <span className="summary-label">Total Spent</span>
            <span className="summary-icon">💸</span>
          </div>
          <div className="summary-amount">{formatINR(totalSpent)}</div>
        </div>

        <div
          className={`summary-card balance ${
            remainingBalance >= 0 ? 'positive' : 'negative'
          }`}
        >
          <div className="summary-card-header">
            <span className="summary-label">Remaining Balance</span>
            <span className="summary-icon">
              {remainingBalance >= 0 ? '💰' : '⚠️'}
            </span>
          </div>
          <div className="summary-amount">{formatINR(remainingBalance)}</div>
        </div>
      </section>

      {/* 1. Visual Progress Bar under Summary Cards */}
      <div className="budget-progress-card">
        <div className="budget-progress-header">
          <div className="budget-progress-info">
            <span className="budget-progress-title">Budget Utilization</span>
            <span className={`budget-percent-pill ${progressStatus}`}>
              {spentPercentage.toFixed(1)}%
            </span>
          </div>
          <span className="budget-progress-stats">
            {formatINR(totalSpent)} spent of {formatINR(totalBudget)}
          </span>
        </div>

        <div className="progress-track" role="progressbar" aria-valuenow={Math.round(spentPercentage)} aria-valuemin="0" aria-valuemax="100">
          <div
            className={`progress-fill ${progressStatus}`}
            style={{ width: `${Math.min(spentPercentage, 100)}%` }}
          ></div>
        </div>

        <div className="progress-footer">
          {isOverBudget ? (
            <span className="budget-warning-text">
              ⚠️ Warning: Budget exceeded by {formatINR(totalSpent - totalBudget)} ({((totalSpent / totalBudget - 1) * 100).toFixed(1)}% over)
            </span>
          ) : (
            <span>
              {formatINR(remainingBalance)} remaining to spend
            </span>
          )}
          <span>{totalBudget > 0 ? `${(100 - Math.min(spentPercentage, 100)).toFixed(0)}% available` : 'No budget set'}</span>
        </div>
      </div>

      {/* 2. Category Breakdown Summary */}
      <section className="card-panel">
        <div className="panel-header-with-action">
          <h2 className="panel-title">Spending by Category</h2>
          <span className="panel-subtitle">Total Expenses: {formatINR(totalSpent)}</span>
        </div>
        <div className="category-breakdown-grid">
          {categoryBreakdown.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <div
                key={cat.name}
                className={`category-summary-card ${isSelected ? 'active-filter' : ''}`}
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                title={`Click to filter by ${cat.name}`}
              >
                <div className="cat-card-top">
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-name">{cat.name}</span>
                </div>
                <div className="cat-amount">{formatINR(cat.total)}</div>
                <div className="cat-meta">
                  <div className="cat-mini-track">
                    <div
                      className={`cat-mini-fill ${cat.fillClass}`}
                      style={{ width: `${Math.min(cat.percent, 100)}%` }}
                    ></div>
                  </div>
                  <span className="cat-percent">{cat.percent.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add New Entry Form */}
      <section className="card-panel">
        <h2 className="panel-title">Add New Entry</h2>
        <form onSubmit={handleAddExpense} className="entry-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tx-title">Title</label>
              <input
                id="tx-title"
                type="text"
                className="form-input"
                placeholder="e.g. Grocery Shopping, Monthly Budget"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tx-amount">Amount (₹)</label>
              <input
                id="tx-amount"
                type="number"
                step="any"
                min="0.01"
                className="form-input"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="tx-type">Type</label>
              <select
                id="tx-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="EXPENSE">Expense</option>
                <option value="BUDGET">Budget</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tx-category">Category</label>
              <select
                id="tx-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : '+ Add Entry'}
          </button>
        </form>
      </section>

      {/* Loading or Error State */}
      {loading ? (
        <div className="loading-box">
          <div className="spinner"></div>
          <p>Connecting to Spring Boot backend at http://localhost:8080/api/expenses...</p>
        </div>
      ) : error ? (
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3 className="error-title">Backend Connection Error</h3>
            <p className="error-message">{error}</p>
            <div className="error-hint">
              Tip: Start the backend server using <code>mvn spring-boot:run</code> or from your IDE.
            </div>
            <div>
              <button onClick={fetchExpenses} className="btn-retry">
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Transactions List Panel */
        <section className="card-panel">
          <div className="filter-bar">
            <div className="filter-left">
              <label htmlFor="filter-cat">Filter by Category:</label>
              <select
                id="filter-cat"
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-stats">
              Showing {filteredExpenses.length} of {expenses.length} entries
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="empty-text">No transactions found</p>
              <p className="empty-subtext">
                {selectedCategory === 'All'
                  ? 'Add your first budget or expense using the form above.'
                  : `No entries found for the category "${selectedCategory}".`}
              </p>
            </div>
          ) : (
            <div className="transaction-list">
              {filteredExpenses.map((item) => (
                <div key={item.id} className="transaction-item">
                  <div className="tx-left">
                    <div className="tx-info">
                      <p className="tx-title">{item.title}</p>
                      <div className="tx-badges">
                        <span
                          className={`badge ${
                            item.type === 'BUDGET'
                              ? 'badge-type-budget'
                              : 'badge-type-expense'
                          }`}
                        >
                          {item.type === 'BUDGET' ? 'Budget' : 'Expense'}
                        </span>
                        <span
                          className={`badge ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="tx-right">
                    <div
                      className={`tx-amount ${
                        item.type === 'BUDGET' ? 'budget' : 'expense'
                      }`}
                    >
                      {item.type === 'BUDGET' ? '+ ' : '- '}
                      {formatINR(item.amount)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="btn-delete"
                      title="Delete entry"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;

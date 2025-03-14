// src/components/PaymentsSubscriptions.js
import React, { useState } from "react";

export default function PaymentsSubscriptions() {
  const [showPaymentHelp, setShowPaymentHelp] = useState(false);
  const [showSubscriptionHelp, setShowSubscriptionHelp] = useState(false);
  const [showFinancialAidHelp, setShowFinancialAidHelp] = useState(false);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Payments & Subscriptions</h1>

      {/* Payments Section */}
      <section className="mb-5">
        <h2>Payments</h2>
        <p>
          Learn how to manage your payments, update payment methods, and resolve payment-related issues.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowPaymentHelp(!showPaymentHelp)}
        >
          {showPaymentHelp ? "Hide Help" : "Show Help"}
        </button>
        {showPaymentHelp && (
          <div>
            <ul>
              <li><strong>Update Payment Method:</strong> Add or change your credit card, debit card, or other payment methods.</li>
              <li><strong>Payment Issues:</strong> Troubleshoot declined payments or failed transactions.</li>
              <li><strong>Payment History:</strong> View your past transactions and download receipts.</li>
            </ul>
            <p>
              For payment-related inquiries, contact our support team at <a href="mailto:payments@learnerhelpcenter.com">payments@learnerhelpcenter.com</a>.
            </p>
          </div>
        )}
      </section>

      {/* Subscriptions Section */}
      <section className="mb-5">
        <h2>Subscriptions</h2>
        <p>
          Manage your subscription plans, upgrade or downgrade your plan, and cancel your subscription if needed.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowSubscriptionHelp(!showSubscriptionHelp)}
        >
          {showSubscriptionHelp ? "Hide Help" : "Show Help"}
        </button>
        {showSubscriptionHelp && (
          <div>
            <ul>
              <li><strong>Subscription Plans:</strong> Explore available plans and choose the one that suits your needs.</li>
              <li><strong>Upgrade/Downgrade:</strong> Change your subscription plan at any time.</li>
              <li><strong>Cancel Subscription:</strong> Learn how to cancel your subscription and what happens after cancellation.</li>
            </ul>
            <p>
              To manage your subscription, go to the <strong>Settings</strong> menu and select <strong>Subscriptions</strong>.
            </p>
          </div>
        )}
      </section>

      {/* Financial Aid Section */}
      <section className="mb-5">
        <h2>Financial Aid</h2>
        <p>
          Explore financial aid options to help you access our courses and services at a reduced cost or for free.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowFinancialAidHelp(!showFinancialAidHelp)}
        >
          {showFinancialAidHelp ? "Hide Help" : "Show Help"}
        </button>
        {showFinancialAidHelp && (
          <div>
            <ul>
              <li><strong>Eligibility:</strong> Check if you qualify for financial aid based on your circumstances.</li>
              <li><strong>Application Process:</strong> Learn how to apply for financial aid and what documents are required.</li>
              <li><strong>Approval Timeline:</strong> Understand how long it takes to process your financial aid application.</li>
            </ul>
            <p>
              For more information, visit our <a href="/financial-aid">Financial Aid</a> page or email us at <a href="mailto:financialaid@learnerhelpcenter.com">financialaid@learnerhelpcenter.com</a>.
            </p>
          </div>
        )}
      </section>

      {/* Additional Support Section */}
      <section>
        <h2>Need More Help?</h2>
        <p>
          If you need further assistance, please visit our <a href="/support">Support Center</a> or contact us directly at <a href="mailto:support@learnerhelpcenter.com">support@learnerhelpcenter.com</a>.
        </p>
      </section>
    </div>
  );
}
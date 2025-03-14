// src/components/helpcenter/Enrollment.js
import React, { useState } from "react";

export default function Enrollment() {
  const [showCourseSelectionHelp, setShowCourseSelectionHelp] = useState(false);
  const [showEnrollmentOptionsHelp, setShowEnrollmentOptionsHelp] = useState(false);
  const [showTroubleshootingHelp, setShowTroubleshootingHelp] = useState(false);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Enrollment</h1>

      {/* Course Selection Section */}
      <section className="mb-5">
        <h2>Course Selection</h2>
        <p>
          Discover how to find the right courses for your learning goals and interests.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowCourseSelectionHelp(!showCourseSelectionHelp)}
        >
          {showCourseSelectionHelp ? "Hide Help" : "Show Help"}
        </button>
        {showCourseSelectionHelp && (
          <div>
            <ul>
              <li><strong>Browse Courses:</strong> Use the search and filter options to find courses by topic, level, or duration.</li>
              <li><strong>Read Reviews:</strong> Check reviews and ratings from other learners to make informed decisions.</li>
              <li><strong>Preview Content:</strong> Watch course previews to get a feel for the teaching style and content.</li>
            </ul>
            <p>
              For personalized recommendations, visit our <a href="/course-recommendations">Course Recommendations</a> page.
            </p>
          </div>
        )}
      </section>

      {/* Enrollment Options Section */}
      <section className="mb-5">
        <h2>Enrollment Options</h2>
        <p>
          Learn about the different ways to enroll in courses, including free and paid options.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowEnrollmentOptionsHelp(!showEnrollmentOptionsHelp)}
        >
          {showEnrollmentOptionsHelp ? "Hide Help" : "Show Help"}
        </button>
        {showEnrollmentOptionsHelp && (
          <div>
            <ul>
              <li><strong>Free Enrollment:</strong> Enroll in courses for free and access basic content.</li>
              <li><strong>Paid Enrollment:</strong> Gain full access to course materials, assignments, and certificates.</li>
              <li><strong>Financial Aid:</strong> Apply for financial aid to access paid courses at no cost.</li>
            </ul>
            <p>
              To enroll in a course, visit the course page and click the <strong>Enroll</strong> button.
            </p>
          </div>
        )}
      </section>

      {/* Troubleshooting Enrollment Issues Section */}
      <section className="mb-5">
        <h2>Troubleshooting Enrollment Issues</h2>
        <p>
          If you're having trouble enrolling in a course, follow these steps to resolve common issues:
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowTroubleshootingHelp(!showTroubleshootingHelp)}
        >
          {showTroubleshootingHelp ? "Hide Help" : "Show Help"}
        </button>
        {showTroubleshootingHelp && (
          <div>
            <ul>
              <li><strong>Payment Issues:</strong> Ensure your payment method is valid and up-to-date.</li>
              <li><strong>Account Issues:</strong> Make sure you're logged into the correct account.</li>
              <li><strong>Technical Issues:</strong> Clear your browser cache or try a different browser.</li>
            </ul>
            <p>
              If you continue to experience issues, please contact our support team at <a href="mailto:support@learnerhelpcenter.com">support@learnerhelpcenter.com</a>.
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
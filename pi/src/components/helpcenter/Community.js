// src/components/helpcenter/Community.js
import React, { useState } from "react";

export default function Community() {
  const [showGettingStartedHelp, setShowGettingStartedHelp] = useState(false);
  const [showDiscussionTipsHelp, setShowDiscussionTipsHelp] = useState(false);
  const [showPopularTopicsHelp, setShowPopularTopicsHelp] = useState(false);

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Community</h1>

      {/* Getting Started Section */}
      <section className="mb-5">
        <h2>Getting Started</h2>
        <p>
          Learn how to join the community, create a profile, and start participating in discussions.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowGettingStartedHelp(!showGettingStartedHelp)}
        >
          {showGettingStartedHelp ? "Hide Help" : "Show Help"}
        </button>
        {showGettingStartedHelp && (
          <div>
            <ul>
              <li><strong>Create a Profile:</strong> Set up your community profile to share your interests and expertise.</li>
              <li><strong>Join Discussions:</strong> Browse topics and join conversations that interest you.</li>
              <li><strong>Ask Questions:</strong> Post your questions and get answers from other learners.</li>
            </ul>
            <p>
              To get started, visit the <a href="/community">Community Homepage</a>.
            </p>
          </div>
        )}
      </section>

      {/* Discussion Tips Section */}
      <section className="mb-5">
        <h2>Discussion Tips</h2>
        <p>
          Make the most of your community experience with these tips for effective discussions.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowDiscussionTipsHelp(!showDiscussionTipsHelp)}
        >
          {showDiscussionTipsHelp ? "Hide Help" : "Show Help"}
        </button>
        {showDiscussionTipsHelp && (
          <div>
            <ul>
              <li><strong>Be Respectful:</strong> Treat others with kindness and respect in all interactions.</li>
              <li><strong>Stay On Topic:</strong> Keep discussions relevant to the topic at hand.</li>
              <li><strong>Share Knowledge:</strong> Help others by sharing your experiences and insights.</li>
            </ul>
            <p>
              For more tips, check out our <a href="/community-guidelines">Community Guidelines</a>.
            </p>
          </div>
        )}
      </section>

      {/* Popular Topics Section */}
      <section className="mb-5">
        <h2>Popular Topics</h2>
        <p>
          Explore some of the most popular discussions happening in the community.
        </p>
        <button
          className="btn btn-link"
          onClick={() => setShowPopularTopicsHelp(!showPopularTopicsHelp)}
        >
          {showPopularTopicsHelp ? "Hide Help" : "Show Help"}
        </button>
        {showPopularTopicsHelp && (
          <div>
            <ul className="list-group">
              <li className="list-group-item">
                <a href="/community/time-expired" className="text-decoration-none">
                  Time allotted has expired, please submit
                </a>
              </li>
              <li className="list-group-item">
                <a href="/community/certification-fee" className="text-decoration-none">
                  Is certification course fee applied on top of Coursera fee?
                </a>
              </li>
              <li className="list-group-item">
                <a href="/community/financial-aid" className="text-decoration-none">
                  Financial Aid for Multiple Courses
                </a>
              </li>
              <li className="list-group-item">
                <a href="/community/quiz-error" className="text-decoration-none">
                  Error message appeared in quiz
                </a>
              </li>
              <li className="list-group-item">
                <a href="/community/music-course" className="text-decoration-none">
                  Can You Recommend a Music Course?
                </a>
              </li>
              <li className="list-group-item">
                <a href="/community/career-change" className="text-decoration-none">
                  How difficult is it to change your career?
                </a>
              </li>
              <li className="list-group-item">
                <a href="/community/data-science-roadmap" className="text-decoration-none">
                  Roadmap in Data Science for Beginners
                </a>
              </li>
              <li className="list-group-item">
                <a href="/community/data-analyst-qa" className="text-decoration-none">
                  How to Become a Data Analyst: Q&A with IBM Instructors
                </a>
              </li>
            </ul>
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
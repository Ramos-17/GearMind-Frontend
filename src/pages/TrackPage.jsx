import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import NavBar from '../components/NavBar';
import './TrackPage.css';

function TrackPage() {
  const [lastName, setLastName] = useState('');
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
  setError('');
  setJobs([]);
  setLoading(true);
  try {
    const url = await lastName.trim()
      ? `/api/jobs/search?lastName=${encodeURIComponent(lastName)}`
      : `/api/jobs/public`;

   const data = await apiFetch(url);
    if (Array.isArray(data) && data.length === 0) {
      setError('No jobs found for that last name');
    } else {
      setJobs(data);
    }
  } catch (err) {
    console.error('Error fetching jobs:', err);
    setError(err.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="track-container">
      <NavBar />
      <div className="track-section">
        <div className="track-content">
          <h1>Track Your Vehicle</h1>
          <p className="track-subtitle">Enter your last name to check the status of your repair</p>

          <div className="track-form">
            <input
              type="text"
              placeholder="Enter Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="track-input"
            />
            <button onClick={handleTrack} className="track-submit-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Track Status'}
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          {jobs.map((job) => (
            <div className="job-info-card" key={job.id}>
              <h2>Repair Status</h2>
              <div className="job-details">
                <div className="job-detail">
                  <span className="detail-label">Customer:</span>
                  <span className="detail-value">{job.customerName}</span>
                </div>
                <div className="job-detail">
                  <span className="detail-label">Vehicle:</span>
                  <span className="detail-value">{job.vehicleInfo}</span>
                </div>
                <div className="job-detail">
                  <span className="detail-label">Current Stage:</span>
                  <span className="detail-value">{job.currentStage}</span>
                </div>
                <div className="job-detail">
                  <span className="detail-label">Technician:</span>
                  <span className="detail-value">{job.assignedTechnician || 'Unassigned'}</span>
                </div>
                <div className="job-detail">
                  <span className="detail-label">Notes:</span>
                  <span className="detail-value">{job.jobNotes || 'No notes yet'}</span>
                </div>
                <div className="job-detail">
                  <span className="detail-label">Started:</span>
                  <span className="detail-value">{new Date(job.createdAt).toLocaleString() || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrackPage;
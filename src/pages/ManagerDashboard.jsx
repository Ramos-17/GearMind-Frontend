import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import NavBar from '../components/NavBar';
import './ManagerDashboard.css';

function ManagerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [archivedJobs, setArchivedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [hasError, setHasError] = useState(false);

  // Get current user from session storage
  useEffect(() => {
    try {
      const username = sessionStorage.getItem('username') || 'Manager';
      setCurrentUser(username);
    } catch (err) {
      console.error('Error getting username from session storage:', err);
      setCurrentUser('Manager');
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    setHasError(false);
    try {
      const data = await apiFetch('/api/jobs/all');
      // Ensure data is an array and has required fields
      if (Array.isArray(data)) {
        const processedJobs = data.map(job => ({
          ...job,
          archived: job.archived || false,
          customerName: job.customerName || 'Unknown Customer',
          vehicleInfo: job.vehicleInfo || 'No vehicle info',
          assignedTechnician: job.assignedTechnician || '',
          jobNotes: job.jobNotes || '',
          currentStage: job.currentStage || 'ESTIMATE'
        }));
        
        // Filter out archived jobs and remove duplicates
        const activeJobs = processedJobs
          .filter(job => !job.archived)
          .filter((job, index, self) => 
            index === self.findIndex(j => j.id === job.id)
          );
        
        setJobs(activeJobs);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setJobs([]);
        setError('Invalid data format received from server');
        setHasError(true);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Error fetching jobs');
      setJobs([]);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArchivedJobs = useCallback(async () => {
    try {
      const data = await apiFetch('/api/jobs/archived');
      // Ensure data is an array and has required fields
      if (Array.isArray(data)) {
        const processedJobs = data.map(job => ({
          ...job,
          archived: true, // Force archived flag for archived jobs
          customerName: job.customerName || 'Unknown Customer',
          vehicleInfo: job.vehicleInfo || 'No vehicle info',
          assignedTechnician: job.assignedTechnician || '',
          jobNotes: job.jobNotes || '',
          currentStage: job.currentStage || 'COMPLETE' // Default to COMPLETE for archived jobs
        }));
        
        // Remove duplicates based on job ID
        const uniqueJobs = processedJobs.filter((job, index, self) => 
          index === self.findIndex(j => j.id === job.id)
        );
        
        setArchivedJobs(uniqueJobs);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setArchivedJobs([]);
      }
    } catch (err) {
      console.error('Error fetching archived jobs:', err);
      setArchivedJobs([]);
        }
  }, []);

  const fetchJobHistory = async (jobId) => {
    try {
      const data = await apiFetch(`/api/jobs/${jobId}/history`);
      if (Array.isArray(data)) {
        setJobHistory(data);
      } else {
        console.error('Expected array but got:', typeof data, data);
        setJobHistory([]);
      }
    } catch (err) {
      console.error('Error fetching job history:', err);
      setError('Error fetching job history');
      setJobHistory([]);
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setDeletingJobId(jobId);
    try {
      await apiFetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      });
      
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      setArchivedJobs(prevArchived => prevArchived.filter(job => job.id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err.message || 'Error deleting job');
    } finally {
      setDeletingJobId(null);
    }
  };

  const archiveJob = async (jobId) => {
    try {
      await apiFetch(`/api/jobs/${jobId}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ archivedBy: currentUser })
      });
      
      // Move job from active to archived
      setJobs(prevJobs => {
        const jobToArchive = prevJobs.find(job => job.id === jobId);
        if (jobToArchive) {
          const archivedJob = { ...jobToArchive, archived: true };
          setArchivedJobs(prevArchived => {
            // Check if job already exists in archived list
            const existingJob = prevArchived.find(job => job.id === jobId);
            if (existingJob) {
              return prevArchived; // Don't add duplicate
            }
            return [...prevArchived, archivedJob];
          });
          return prevJobs.filter(job => job.id !== jobId);
        }
        return prevJobs;
      });
    } catch (err) {
      console.error('Error archiving job:', err);
      setError(err.message || 'Error archiving job. Only completed jobs can be archived.');
    }
  };

  const completeAndArchiveJob = async (jobId) => {
    try {
      // First, advance the job to COMPLETE stage
      await apiFetch(`/api/jobs/${jobId}/update-stage-with-user`, {
        method: 'PUT',
        body: JSON.stringify({ 
          newStage: 'COMPLETE',
          updatedBy: currentUser 
        })
      });

      // Then archive the job
      await apiFetch(`/api/jobs/${jobId}/archive`, {
        method: 'PUT',
        body: JSON.stringify({ archivedBy: currentUser })
      });
      
      // Move job from active to archived with COMPLETE stage
      setJobs(prevJobs => {
        const jobToArchive = prevJobs.find(job => job.id === jobId);
        if (jobToArchive) {
          const archivedJob = { 
            ...jobToArchive, 
            archived: true, 
            currentStage: 'COMPLETE',
            lastUpdated: new Date().toISOString()
          };
          setArchivedJobs(prevArchived => {
            // Check if job already exists in archived list
            const existingJob = prevArchived.find(job => job.id === jobId);
            if (existingJob) {
              return prevArchived; // Don't add duplicate
            }
            return [...prevArchived, archivedJob];
          });
          return prevJobs.filter(job => job.id !== jobId);
        }
        return prevJobs;
      });
    } catch (err) {
      console.error('Error completing and archiving job:', err);
      setError(err.message || 'Error completing and archiving job.');
    }
  };

  const unarchiveJob = async (jobId) => {
    try {
      await apiFetch(`/api/jobs/${jobId}/unarchive`, {
        method: 'PUT',
        body: JSON.stringify({ archivedBy: currentUser })
      });
      
      // Move job from archived to active
      setArchivedJobs(prevArchived => {
        const jobToUnarchive = prevArchived.find(job => job.id === jobId);
        if (jobToUnarchive) {
          const unarchivedJob = { ...jobToUnarchive, archived: false };
          setJobs(prevJobs => {
            // Check if job already exists in active list
            const existingJob = prevJobs.find(job => job.id === jobId);
            if (existingJob) {
              return prevJobs; // Don't add duplicate
            }
            return [...prevJobs, unarchivedJob];
          });
          return prevArchived.filter(job => job.id !== jobId);
        }
        return prevArchived;
      });
    } catch (err) {
      console.error('Error unarchiving job:', err);
      setError(err.message || 'Error unarchiving job');
    }
  };

  const updateJobStage = async (jobId, newStage) => {
    try {
      await apiFetch(`/api/jobs/${jobId}/update-stage-with-user`, {
        method: 'PUT',
        body: JSON.stringify({ 
          newStage: newStage,
          updatedBy: currentUser 
        })
      });
      
      // Update local state
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? { ...job, currentStage: newStage, lastUpdated: new Date().toISOString() } : job
      ));
      
      setArchivedJobs(prevArchived => prevArchived.map(job => 
        job.id === jobId ? { ...job, currentStage: newStage, lastUpdated: new Date().toISOString() } : job
      ));
    } catch (err) {
      console.error('Error updating job stage:', err);
      setError(err.message || 'Error updating job stage');
    }
  };

  const saveJobEdit = async (jobId, updatedJob) => {
    try {
      await apiFetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          job: updatedJob,
          updatedBy: currentUser 
        })
      });
      
      // Update local state
      const processedJob = {
        ...updatedJob,
        lastUpdated: new Date().toISOString(),
        archived: updatedJob.archived || false
      };
      
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? processedJob : job
      ));
      
      setArchivedJobs(prevArchived => prevArchived.map(job => 
        job.id === jobId ? processedJob : job
      ));
      
      setEditingJob(null);
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.message || 'Error updating job');
    }
  };

  const viewJobHistory = async (jobId) => {
    setViewingHistory(jobId);
    await fetchJobHistory(jobId);
  };

  useEffect(() => {
    fetchJobs();
    fetchArchivedJobs();
  }, [fetchJobs, fetchArchivedJobs]);

  const jobStages = ['ESTIMATE', 'TEARDOWN', 'REPAIR', 'PAINT', 'DETAIL', 'COMPLETE'];

  const renderJobCard = (job, isArchived = false) => {
    // Defensive check for job data
    if (!job || !job.id) {
      console.error('Invalid job data:', job);
      return null;
    }

    return (
      <div key={job.id} className={`job-card ${isArchived ? 'archived' : ''}`}>
        <div className="job-header">
          <div className="job-title">
            <h3>{job.customerName || 'Unknown Customer'}</h3>
            <span className={`job-stage ${(job.currentStage || 'ESTIMATE').toLowerCase()}`}>
              {job.currentStage || 'ESTIMATE'}
            </span>
            {isArchived && <span className="archived-badge">ARCHIVED</span>}
          </div>
          <div className="job-actions">
            <button 
              onClick={() => viewJobHistory(job.id)} 
              className="action-btn history-btn"
            >
              History
            </button>
            <button 
              className="action-btn edit-btn"
              onClick={() => setEditingJob(job)}
              title="Edit Job"
            >
              Edit
            </button>
            {job.currentStage !== 'COMPLETE' && !isArchived && (
              <button 
                onClick={() => completeAndArchiveJob(job.id)} 
                className="action-btn complete-archive-btn"
              >
                Complete & Archive
              </button>
            )}
            {job.currentStage === 'COMPLETE' && !isArchived && (
              <button 
                onClick={() => archiveJob(job.id)} 
                className="action-btn archive-btn"
              >
                Archive
              </button>
            )}
            {isArchived && (
              <button 
                onClick={() => unarchiveJob(job.id)} 
                className="action-btn unarchive-btn"
              >
                Unarchive
              </button>
            )}
            <button 
              onClick={() => deleteJob(job.id)} 
              className="action-btn delete-btn"
              disabled={deletingJobId === job.id}
            >
              {deletingJobId === job.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
        
        <div className="job-details">
          <div className="detail-row">
            <span><strong>Vehicle:</strong> {job.vehicleInfo || 'No vehicle info'}</span>
            <span><strong>Technician:</strong> {job.assignedTechnician || 'Unassigned'}</span>
          </div>
          <div className="detail-row">
            <span><strong>Notes:</strong> {job.jobNotes || 'No notes'}</span>
          </div>
          <div className="detail-row">
            <span><strong>Last Updated:</strong> {job.lastUpdated ? new Date(job.lastUpdated).toLocaleString() : 'N/A'}</span>
            <span><strong>Created:</strong> {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}</span>
          </div>
          
          <div className="stage-controls">
            <label><strong>Advance Stage:</strong></label>
            <select 
              value={job.currentStage || 'ESTIMATE'} 
              onChange={(e) => updateJobStage(job.id, e.target.value)}
              disabled={isArchived}
            >
              {jobStages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingJob) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Edit Job: {editingJob.customerName}</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedJob = {
              ...editingJob,
              customerName: formData.get('customerName'),
              customerLastName: formData.get('customerLastName'),
              vehicleInfo: formData.get('vehicleInfo'),
              assignedTechnician: formData.get('assignedTechnician'),
              jobNotes: formData.get('jobNotes')
            };
            saveJobEdit(editingJob.id, updatedJob);
          }}>
            <div className="form-group">
              <label>Customer Name:</label>
              <input 
                name="customerName" 
                defaultValue={editingJob.customerName} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Customer Last Name:</label>
              <input 
                name="customerLastName" 
                defaultValue={editingJob.customerLastName} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Vehicle Info:</label>
              <input 
                name="vehicleInfo" 
                defaultValue={editingJob.vehicleInfo} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Assigned Technician:</label>
              <input 
                name="assignedTechnician" 
                defaultValue={editingJob.assignedTechnician} 
              />
            </div>
            <div className="form-group">
              <label>Job Notes:</label>
              <textarea 
                name="jobNotes" 
                defaultValue={editingJob.jobNotes} 
                rows="4"
              />
            </div>
            <div className="modal-actions">
              <button type="submit" className="save-btn">Save Changes</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setEditingJob(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderHistoryModal = () => {
    if (!viewingHistory) return null;
    
    const job = [...jobs, ...archivedJobs].find(j => j.id === viewingHistory);
    
    return (
      <div className="modal-overlay">
        <div className="modal history-modal">
          <h3>Job History: {job?.customerName}</h3>
          <div className="history-list">
            {jobHistory.length === 0 ? (
              <p>No history available for this job.</p>
            ) : (
              jobHistory.map((entry, index) => (
                <div key={index} className="history-entry">
                  <div className="history-header">
                    <span className="history-action">{entry.action}</span>
                    <span className="history-timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="history-details">
                    <span><strong>Field:</strong> {entry.fieldName}</span>
                    <span><strong>Updated By:</strong> {entry.updatedBy}</span>
                  </div>
                  {entry.oldValue && entry.newValue && (
                    <div className="history-changes">
                      <span className="old-value">From: {entry.oldValue}</span>
                      <span className="new-value">To: {entry.newValue}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="modal-actions">
            <button 
              className="close-btn"
              onClick={() => setViewingHistory(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Error boundary - if there's a critical error, show a simple recovery UI
  if (hasError) {
    return (
      <div className="dashboard-container">
        <NavBar />
        <div className="error-recovery">
          <h2>Something went wrong</h2>
          <p>There was an error loading the dashboard. Please try refreshing the page.</p>
          <button 
            onClick={() => {
              setHasError(false);
              setError('');
              fetchJobs();
              fetchArchivedJobs();
            }}
            className="retry-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <NavBar />

      <div className="dashboard-header">
        <h2>Manager Dashboard</h2>
        <div className="dashboard-controls">
          <button 
            onClick={fetchJobs} 
            className="refresh-btn" 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button 
            onClick={() => {
              setShowArchived(!showArchived);
              if (!showArchived) {
                fetchArchivedJobs();
              }
            }} 
            className={`toggle-btn ${showArchived ? 'active' : ''}`}
          >
            {showArchived ? 'Show Active Jobs' : 'Show Archived Jobs'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">Loading jobs...</div>}

      {!loading && (
        <div className="jobs-section">
          <h3>{showArchived ? 'Archived Jobs' : 'Active Jobs'}</h3>
          {showArchived ? (
            archivedJobs.length === 0 ? (
              <p className="no-jobs">No archived jobs found.</p>
            ) : (
              <div className="jobs-grid">
                {archivedJobs.map(job => renderJobCard(job, true))}
              </div>
            )
          ) : (
            jobs.length === 0 ? (
              <p className="no-jobs">No active jobs found.</p>
            ) : (
              <div className="jobs-grid">
                {jobs.map(job => renderJobCard(job))}
              </div>
            )
          )}
        </div>
      )}

      {renderEditModal()}
      {renderHistoryModal()}
    </div>
  );
}

export default ManagerDashboard;
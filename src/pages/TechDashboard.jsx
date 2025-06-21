// TODO: Tech can send job back to Painter or to Painter
// TODO: Tech can also mark job as completed
// TODO: If job is marked as 'Completed', it should appear in ManagerDashboard.jsx under 'Show Archived Jobs'
// TODO: Tech should be able to add job notes and changes should be saved and the customer should be able to see the notes the employees put on the trackpage
// TODO: When job pages refreshes it should not restart the job

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import NavBar from '../components/NavBar';
import './TechDashboard.css';

function TechDashboard() {
  const [jobs, setJobs] = useState([]);
  const [originalJobs, setOriginalJobs] = useState([]); // Store original server data
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [techUsers, setTechUsers] = useState([]);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [savingJobId, setSavingJobId] = useState(null);
  const [showPainterAssign, setShowPainterAssign] = useState(false);
  const [showDetailerAssign, setShowDetailerAssign] = useState(false);
  const [painterUsers, setPainterUsers] = useState([]);
  const [detailerUsers, setDetailerUsers] = useState([]);
  const [handoffJobId, setHandoffJobId] = useState(null);
  const [selectedPainter, setSelectedPainter] = useState('');
  const [selectedDetailer, setSelectedDetailer] = useState('');

  // Check if there are unsaved changes
  const checkForUnsavedChanges = useCallback(() => {
    if (!originalJobs.length || !jobs.length) return false;
    
    // Compare current jobs with original jobs
    const hasChanges = jobs.some(currentJob => {
      const originalJob = originalJobs.find(oj => oj.id === currentJob.id);
      if (!originalJob) return false;
      
      return currentJob.notes !== originalJob.notes ||
             currentJob.currentStage !== originalJob.currentStage ||
             currentJob.assignedTechnician !== originalJob.assignedTechnician;
    });
    
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [jobs, originalJobs]);

  // Fetch jobs from server
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔧 Fetching jobs...');
      console.log('🔧 Current user:', currentUser);
      console.log('🔧 Token exists:', !!sessionStorage.getItem('token'));
      
      const allJobsData = await apiFetch('/api/jobs/all');
      console.log('🔧 All jobs fetched:', allJobsData);
      
      if (allJobsData && Array.isArray(allJobsData)) {
        setOriginalJobs(allJobsData);
        
        // Filter for TEARDOWN and REPAIR jobs (not completed/archived)
        const techJobs = allJobsData.filter(job => 
          (job.currentStage === 'TEARDOWN' || job.currentStage === 'REPAIR') && !job.archived
        );
        
        console.log('🔧 Filtered tech jobs:', techJobs);
        console.log('🔧 Number of tech jobs:', techJobs.length);
        
        // Log each job's stage for debugging
        techJobs.forEach(job => {
          console.log(`🔧 Job ${job.id} (${job.customerName}): ${job.currentStage}`);
        });
        
        setJobs(techJobs);
        setLastRefresh(new Date());
      } else {
        console.warn('No jobs found or invalid response:', allJobsData);
        setJobs([]);
        setOriginalJobs([]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs');
      setJobs([]);
      setOriginalJobs([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchTechUsers = useCallback(async () => {
    try {
      // Fetch tech users from the backend
      const users = await apiFetch('/api/auth/users/tech');
      if (users && Array.isArray(users)) {
        if (users.length === 0) {
          console.warn('No tech users found in database, using fallback');
          setTechUsers(['techuser', 'tech1', 'tech2', 'tech3']);
        } else {
          setTechUsers(users);
        }
      } else {
        console.warn('Invalid response format for tech users:', users);
        setTechUsers([]);
      }
    } catch (err) {
      console.error('Error fetching tech users:', err);
      setTechUsers([]);
    }
  }, []);

  // Fetch painter users for handoff
  const fetchPainterUsers = useCallback(async () => {
    try {
      console.log('🎨 Fetching painter users...');
      console.log('🎨 Current user:', currentUser);
      console.log('🎨 Token exists:', !!sessionStorage.getItem('token'));
      
      const users = await apiFetch('/api/auth/users/painter');
      console.log('🎨 Painter users fetched:', users);
      
      if (users && Array.isArray(users)) {
        console.log('🎨 Setting painter users:', users);
        setPainterUsers(users);
      } else {
        console.warn('No painter users found or invalid response:', users);
        console.warn('Response type:', typeof users);
        setPainterUsers([]);
      }
    } catch (err) {
      console.error('Error fetching painter users:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        response: err.response
      });
      setPainterUsers([]);
    }
  }, [currentUser]);

  // Fetch detailer users for handoff
  const fetchDetailerUsers = useCallback(async () => {
    try {
      console.log('🧽 Fetching detailer users...');
      const users = await apiFetch('/api/auth/users/detailer');
      console.log('🧽 Detailer users fetched:', users);
      if (users && Array.isArray(users)) {
        setDetailerUsers(users);
      } else {
        console.warn('No detailer users found or invalid response:', users);
        setDetailerUsers([]);
      }
    } catch (err) {
      console.error('Error fetching detailer users:', err);
      setDetailerUsers([]);
    }
  }, []);

  const updateJob = async (jobId, updates) => {
    setSavingJobId(jobId);
    try {
      // Find the current job to preserve all existing data
      const currentJob = jobs.find(job => job.id === jobId);
      if (!currentJob) {
        throw new Error('Job not found');
      }

      // Create a complete job object with the updates applied
      const updatedJobData = {
        ...currentJob,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      await apiFetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify({
          job: updatedJobData,
          updatedBy: currentUser
        })
      });

      // Update local state
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId 
          ? { ...job, ...updates, lastUpdated: new Date().toISOString() }
          : job
      ));

      // Also update originalJobs state
      setOriginalJobs(prevOriginalJobs => prevOriginalJobs.map(job => 
        job.id === jobId 
          ? { ...job, ...updates, lastUpdated: new Date().toISOString() }
          : job
      ));

      setSuccess('Job updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reset editing state
      setEditingJobId(null);
      setEditingNotes('');
      setSelectedStage('all');
      setSelectedTechnician('');
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.message || 'Error updating job');
    } finally {
      setSavingJobId(null);
    }
  };

  // Start editing a job
  const startEditing = (job) => {
    setEditingJobId(job.id);
    setEditingNotes(job.notes || '');
    setSelectedStage(job.currentStage || 'all');
    setSelectedTechnician(job.assignedTechnician || '');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingJobId(null);
    setEditingNotes('');
    setSelectedStage('all');
    setSelectedTechnician('');
  };

  const saveJobChanges = async (jobId) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const updates = {};
      
      if (editingNotes !== job.notes) {
        updates.notes = editingNotes;
      }
      
      if (selectedTechnician && selectedTechnician !== job.assignedTechnician) {
        updates.assignedTechnician = selectedTechnician;
      }
      
      if (selectedStage && selectedStage !== 'all' && selectedStage !== job.currentStage) {
        updates.currentStage = selectedStage;
      }

      if (Object.keys(updates).length > 0) {
        console.log('💾 Saving job changes:', { jobId, updates });
        console.log('💾 Original job state:', job);
        console.log('💾 Updates to be applied:', updates);
        
        // Create complete job object with updates applied
        const updatedJobData = {
          ...job,
          ...updates,
          lastUpdated: new Date().toISOString()
        };
        
        const requestBody = {
          job: updatedJobData,
          updatedBy: currentUser
        };
        console.log('💾 Request body being sent:', requestBody);
        
        const response = await apiFetch(`/api/jobs/${jobId}`, {
          method: 'PUT',
          body: JSON.stringify(requestBody)
        });
        
        console.log('✅ Job updated successfully:', response);
        console.log('✅ Response from server:', response);
        
        // Update both local state and original jobs
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId ? { ...job, ...updates } : job
          )
        );
        
        setOriginalJobs(prevOriginalJobs => 
          prevOriginalJobs.map(job => 
            job.id === jobId ? { ...job, ...updates } : job
          )
        );
        
        setSuccess('Job updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Reset editing state
        setEditingJobId(null);
        setEditingNotes('');
        setSelectedStage('all');
        setSelectedTechnician('');
      } else {
        setError('No changes to save');
      }
    } catch (err) {
      console.error('Error saving job changes:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        response: err.response
      });
      setError(err.message || 'Error saving changes');
    }
  };

  const handleRefresh = () => {
    fetchJobs();
  };

  const discardChanges = () => {
    setJobs([...originalJobs]);
    setHasUnsavedChanges(false);
    setEditingJobId(null);
    setEditingNotes('');
    setSelectedStage('all');
    setSelectedTechnician('');
  };

  // NEW: Mark job as completed
  const markJobCompleted = async (jobId) => {
    try {
      const updates = {
        currentStage: 'COMPLETE',
        archived: true,
        lastUpdated: new Date().toISOString()
      };
      
      await updateJob(jobId, updates);
      setSuccess('Job marked as completed and archived!');
    } catch (err) {
      console.error('Error marking job as completed:', err);
      setError(err.message || 'Error completing job');
    }
  };

  // NEW: Handoff to Painter
  const handoffToPainter = async (jobId) => {
    if (!selectedPainter) {
      setError('Please select a painter');
      return;
    }

    try {
      const updates = {
        currentStage: 'PAINT',
        assignedTechnician: selectedPainter,
        lastUpdated: new Date().toISOString()
      };
      
      await updateJob(jobId, updates);
      setShowPainterAssign(false);
      setHandoffJobId(null);
      setSelectedPainter('');
      setSuccess('Job handed off to painter successfully!');
    } catch (err) {
      console.error('Error handing off to painter:', err);
      setError(err.message || 'Error handing off job');
    }
  };

  // NEW: Handoff to Detailer
  const handoffToDetailer = async (jobId) => {
    if (!selectedDetailer) {
      setError('Please select a detailer');
      return;
    }

    try {
      const updates = {
        currentStage: 'DETAIL',
        assignedTechnician: selectedDetailer,
        lastUpdated: new Date().toISOString()
      };
      
      await updateJob(jobId, updates);
      setShowDetailerAssign(false);
      setHandoffJobId(null);
      setSelectedDetailer('');
      setSuccess('Job handed off to detailer successfully!');
    } catch (err) {
      console.error('Error handing off to detailer:', err);
      setError(err.message || 'Error handing off job');
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchTechUsers();
    fetchPainterUsers();
    fetchDetailerUsers();
  }, [fetchTechUsers, fetchPainterUsers, fetchDetailerUsers]);

  // Load jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Get current user from session storage
  useEffect(() => {
    const username = sessionStorage.getItem('username') || 'Tech';
    setCurrentUser(username);
  }, []);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchJobs();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobs]);

  // Check for unsaved changes whenever jobs change
  useEffect(() => {
    checkForUnsavedChanges();
  }, [jobs, checkForUnsavedChanges]);

  const jobStages = ['TEARDOWN', 'REPAIR'];

  return (
    <div className="dashboard-container">
      <NavBar />
      <div className="tech-dashboard">
        <div className="dashboard-header">
          <h1>Tech Dashboard</h1>
          <div className="dashboard-controls">
            {hasUnsavedChanges && (
              <div className="unsaved-changes-warning">
                <span>Unsaved changes</span>
                <button onClick={discardChanges} className="discard-btn">Discard Changes</button>
              </div>
            )}
            <button 
              onClick={handleRefresh} 
              disabled={loading}
              className="refresh-btn"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (2min)
            </label>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="last-refresh">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>

        {loading && <div className="loading">Loading jobs...</div>}

        {!loading && jobs.length === 0 && (
          <div className="no-jobs">
            <p>No tech jobs found.</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <div className="job-title">
                    <h3>{job.customerName}</h3>
                    <span className={`job-stage ${job.currentStage.toLowerCase()}`}>
                      {job.currentStage}
                    </span>
                    {job.assignedTechnician === currentUser && (
                      <span className="assigned-badge">ASSIGNED TO ME</span>
                    )}
                  </div>
                  <div className="job-actions">
                    {editingJobId === job.id ? (
                      <button 
                        onClick={() => saveJobChanges(job.id)} 
                        className="save-btn"
                        disabled={savingJobId === job.id}
                      >
                        {savingJobId === job.id ? 'Saving...' : 'Save Changes'}
                      </button>
                    ) : (
                      <button onClick={() => startEditing(job)} className="edit-btn">
                        Edit Job
                      </button>
                    )}
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
                  
                  {editingJobId === job.id ? (
                    <div className="edit-section">
                      <div className="edit-group">
                        <label><strong>Stage:</strong></label>
                        <select
                          value={selectedStage}
                          onChange={(e) => setSelectedStage(e.target.value)}
                        >
                          {jobStages.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Assign To:</strong></label>
                        <select
                          value={selectedTechnician}
                          onChange={(e) => setSelectedTechnician(e.target.value)}
                        >
                          <option value="">Keep current</option>
                          {techUsers.map(user => (
                            <option key={user} value={user}>{user}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Notes:</strong></label>
                        <textarea
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          placeholder="Add technical notes..."
                          rows="3"
                        />
                      </div>
                      
                      <div className="edit-actions">
                        <button 
                          onClick={() => saveJobChanges(job.id)} 
                          className="save-btn"
                          disabled={savingJobId === job.id}
                        >
                          {savingJobId === job.id ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button 
                          onClick={cancelEditing} 
                          className="cancel-btn"
                          disabled={savingJobId === job.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="stage-controls">
                      <label><strong>Advance Stage:</strong></label>
                      <select 
                        value={job.currentStage || 'TEARDOWN'} 
                        onChange={(e) => updateJob(job.id, { currentStage: e.target.value })}
                      >
                        {jobStages.map(stage => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {!editingJobId && (
                    <div className="stage-actions">
                      <button 
                        onClick={() => markJobCompleted(job.id)}
                        className="complete-btn"
                      >
                        Mark Job Completed
                      </button>
                      <button 
                        onClick={() => {
                          setHandoffJobId(job.id);
                          setShowPainterAssign(true);
                        }}
                        className="handoff-btn"
                      >
                        Handoff to Painter
                      </button>
                      <button 
                        onClick={() => {
                          setHandoffJobId(job.id);
                          setShowDetailerAssign(true);
                        }}
                        className="handoff-btn"
                      >
                        Handoff to Detailer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Painter Assignment Modal */}
        {showPainterAssign && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Assign to Painter</h3>
              <p>Available painters: {painterUsers.length}</p>
              <select value={selectedPainter} onChange={e => setSelectedPainter(e.target.value)}>
                <option value="">Select Painter</option>
                {painterUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
              {painterUsers.length === 0 && (
                <p style={{color: 'red', fontSize: '12px'}}>No painters available. Please contact admin to add painters.</p>
              )}
              <div className="modal-actions">
                <button onClick={() => handoffToPainter(handoffJobId)} className="save-btn" disabled={!selectedPainter}>Assign & Handoff</button>
                <button onClick={() => { setShowPainterAssign(false); setHandoffJobId(null); setSelectedPainter(''); }} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Detailer Assignment Modal */}
        {showDetailerAssign && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Assign to Detailer</h3>
              <p>Available detailers: {detailerUsers.length}</p>
              <select value={selectedDetailer} onChange={e => setSelectedDetailer(e.target.value)}>
                <option value="">Select Detailer</option>
                {detailerUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
              {detailerUsers.length === 0 && (
                <p style={{color: 'red', fontSize: '12px'}}>No detailers available. Please contact admin to add detailers.</p>
              )}
              <div className="modal-actions">
                <button onClick={() => handoffToDetailer(handoffJobId)} className="save-btn" disabled={!selectedDetailer}>Assign & Handoff</button>
                <button onClick={() => { setShowDetailerAssign(false); setHandoffJobId(null); setSelectedDetailer(''); }} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TechDashboard;
// TODO: Painter can send job back to Tech or to Detailer
// TODO: Painter can also mark job as completed
// TODO: If job is marked as 'Completed', it should appear in ManagerDashboard.jsx under 'Show Archived Jobs'
// TODO: Painter should be able to add job notes and changes should be saved and the customer should be able to see the notes the employees put on the trackpage
// TODO: When job pages refreshes it should not restart the job

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import NavBar from '../components/NavBar';
import './PainterDashboard.css';

function PainterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [painterUsers, setPainterUsers] = useState([]);
  const [detailerUsers, setDetailerUsers] = useState([]);
  const [techUsers, setTechUsers] = useState([]);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedPainter, setSelectedPainter] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [savingJobId, setSavingJobId] = useState(null);
  const [showDetailerAssign, setShowDetailerAssign] = useState(false);
  const [showTechAssign, setShowTechAssign] = useState(false);
  const [handoffJobId, setHandoffJobId] = useState(null);
  const [selectedDetailer, setSelectedDetailer] = useState('');
  const [selectedTech, setSelectedTech] = useState('');

  // Paint-specific fields
  const [paintColor, setPaintColor] = useState('');
  const [paintFinish, setPaintFinish] = useState('GLOSS');
  const [paintCode, setPaintCode] = useState('');
  const [paintUsed, setPaintUsed] = useState('');
  const [maskingUsed, setMaskingUsed] = useState('');
  const [prepNotes, setPrepNotes] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🎨 Starting to fetch paint jobs...');
      console.log('🎨 Current user from session storage:', sessionStorage.getItem('username'));
      console.log('🎨 Current role from session storage:', sessionStorage.getItem('role'));
      console.log('🎨 Token exists:', !!sessionStorage.getItem('token'));
      
      const allJobsData = await apiFetch('/api/jobs/all');
      console.log('✅ All jobs fetched successfully:', allJobsData);
      console.log('📊 Number of jobs:', allJobsData ? allJobsData.length : 'null/undefined');
      
      if (allJobsData && Array.isArray(allJobsData)) {
        // Filter for PAINT jobs (not completed/archived)
        const paintJobs = allJobsData.filter(job => 
          job.currentStage === 'PAINT' && !job.archived
        );
        
        console.log('🎨 Filtered paint jobs:', paintJobs);
        console.log('🎨 Number of paint jobs:', paintJobs.length);
        setJobs(paintJobs);
        setLastRefresh(new Date());
      } else {
        console.error('❌ Invalid job data received:', allJobsData);
        setError('Invalid job data received from server');
      }
    } catch (err) {
      console.error('❌ Error fetching jobs:', err);
      setError(err.message || 'Error fetching jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPainterUsers = useCallback(async () => {
    try {
      // Fetch painter users from the backend
      const users = await apiFetch('/api/auth/users/painter');
      if (users && Array.isArray(users)) {
        if (users.length === 0) {
          console.warn('No painter users found in database, using fallback');
          setPainterUsers(['painteruser', 'painter1', 'painter2', 'painter3']);
        } else {
          setPainterUsers(users);
        }
      } else {
        console.warn('Invalid response format for painter users:', users);
        setPainterUsers([]);
      }
    } catch (err) {
      console.error('Error fetching painter users:', err);
      setPainterUsers([]);
    }
  }, []);

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

  // Fetch tech users for handoff
  const fetchTechUsers = useCallback(async () => {
    try {
      console.log('🔧 Fetching tech users...');
      const users = await apiFetch('/api/auth/users/tech');
      console.log('🔧 Tech users fetched:', users);
      console.log('🔧 Response type:', typeof users);
      console.log('🔧 Is array:', Array.isArray(users));
      console.log('🔧 Length:', users ? users.length : 'null/undefined');
      
      if (users && Array.isArray(users)) {
        if (users.length === 0) {
          console.warn('No tech users found in database, using fallback');
          setTechUsers(['techuser', 'tech1', 'tech2', 'tech3']);
        } else {
          console.log('🔧 Setting real tech users:', users);
          setTechUsers(users);
        }
      } else {
        console.warn('Invalid response format for tech users:', users);
        setTechUsers(['techuser', 'tech1', 'tech2', 'tech3']);
      }
    } catch (err) {
      console.error('Error fetching tech users:', err);
      console.warn('API call failed, using fallback tech users');
      setTechUsers(['techuser', 'tech1', 'tech2', 'tech3']);
    }
  }, []);

  // Get current user from session storage
  useEffect(() => {
    const username = sessionStorage.getItem('username') || 'Painter';
    setCurrentUser(username);
  }, []);

  // Load users on component mount
  useEffect(() => {
    fetchPainterUsers();
    fetchDetailerUsers();
    fetchTechUsers();
  }, [fetchPainterUsers, fetchDetailerUsers, fetchTechUsers]);

  // Load jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchJobs();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, fetchJobs]);

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

      setSuccess('Job updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Reset editing state
      setEditingJobId(null);
      setEditingNotes('');
      setSelectedStage('');
      setSelectedPainter('');
      setPaintColor('');
      setPaintFinish('GLOSS');
      setPaintCode('');
      setPaintUsed('');
      setMaskingUsed('');
      setPrepNotes('');
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.message || 'Error updating job');
    } finally {
      setSavingJobId(null);
    }
  };

  const startEditingJob = (job) => {
    setEditingJobId(job.id);
    setEditingNotes(job.jobNotes || '');
    setSelectedStage(job.currentStage);
    setSelectedPainter(job.assignedTechnician || '');
    setPaintColor(job.paintColor || '');
    setPaintFinish(job.paintFinish || 'GLOSS');
    setPaintCode(job.paintCode || '');
    setPaintUsed(job.paintUsed || '');
    setMaskingUsed(job.maskingUsed || '');
    setPrepNotes(job.prepNotes || '');
  };

  const cancelEditingJob = () => {
    setEditingJobId(null);
    setEditingNotes('');
    setSelectedStage('');
    setSelectedPainter('');
    setPaintColor('');
    setPaintFinish('GLOSS');
    setPaintCode('');
    setPaintUsed('');
    setMaskingUsed('');
    setPrepNotes('');
  };

  const saveJobChanges = async (jobId) => {
    const updates = {};
    
    if (editingNotes !== '') {
      updates.jobNotes = editingNotes;
    }
    
    if (selectedStage && selectedStage !== '') {
      updates.currentStage = selectedStage;
    }
    
    if (selectedPainter && selectedPainter !== '') {
      updates.assignedTechnician = selectedPainter;
    }

    // Paint-specific fields
    if (paintColor !== '') {
      updates.paintColor = paintColor;
    }
    if (paintFinish !== 'GLOSS') {
      updates.paintFinish = paintFinish;
    }
    if (paintCode !== '') {
      updates.paintCode = paintCode;
    }
    if (paintUsed !== '') {
      updates.paintUsed = paintUsed;
    }
    if (maskingUsed !== '') {
      updates.maskingUsed = maskingUsed;
    }
    if (prepNotes !== '') {
      updates.prepNotes = prepNotes;
    }

    if (Object.keys(updates).length === 0) {
      setError('No changes to save');
      return;
    }

    try {
      await updateJob(jobId, updates);
    } catch (err) {
      console.error('Error saving job changes:', err);
      setError(err.message || 'Error saving changes');
    }
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

  // NEW: Handoff to Tech
  const handoffToTech = async (jobId) => {
    if (!selectedTech) {
      setError('Please select a tech');
      return;
    }

    try {
      const updates = {
        currentStage: 'REPAIR',
        assignedTechnician: selectedTech,
        lastUpdated: new Date().toISOString()
      };
      
      await updateJob(jobId, updates);
      setShowTechAssign(false);
      setHandoffJobId(null);
      setSelectedTech('');
      setSuccess('Job handed off to tech successfully!');
    } catch (err) {
      console.error('Error handing off to tech:', err);
      setError(err.message || 'Error handing off job');
    }
  };

  const paintFinishes = ['GLOSS', 'MATTE', 'SEMI_GLOSS', 'METALLIC', 'PEARL'];
  const paintStages = ['PAINT'];

  return (
    <div className="dashboard-container">
      <NavBar />
      <div className="painter-dashboard">
        <div className="dashboard-header">
      <h1>Painter Dashboard</h1>
          <div className="dashboard-controls">
            <button 
              onClick={fetchJobs} 
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

        <div className="dashboard-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search by customer, vehicle, paint color, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="stage-filter"
            >
              <option value="ALL">All Paint Jobs</option>
              <option value="PAINT">Paint</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="last-refresh">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>

        {loading && <div className="loading">Loading paint jobs...</div>}

        {!loading && jobs.length === 0 && (
          <div className="no-jobs">
            <p>No paint jobs found.</p>
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
                      <button onClick={() => startEditingJob(job)} className="edit-btn">
                        Edit Job
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="job-details">
                  <div className="detail-row">
                    <span><strong>Vehicle:</strong> {job.vehicleInfo}</span>
                    <span><strong>Painter:</strong> {job.assignedTechnician || 'Unassigned'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span><strong>Paint Color:</strong> {job.paintColor || 'Not specified'}</span>
                    <span><strong>Paint Code:</strong> {job.paintCode || 'Not specified'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span><strong>Paint Finish:</strong> {job.paintFinish || 'Not specified'}</span>
                    <span><strong>Paint Used:</strong> {job.paintUsed || 'Not tracked'}</span>
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
                          {paintStages.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Assign To:</strong></label>
                        <select
                          value={selectedPainter}
                          onChange={(e) => setSelectedPainter(e.target.value)}
                        >
                          <option value="">Keep current</option>
                          {painterUsers.map(user => (
                            <option key={user} value={user}>{user}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Paint Color:</strong></label>
                        <input
                          type="text"
                          value={paintColor}
                          onChange={(e) => setPaintColor(e.target.value)}
                          placeholder="e.g., Deep Blue Metallic"
                        />
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Paint Code:</strong></label>
                        <input
                          type="text"
                          value={paintCode}
                          onChange={(e) => setPaintCode(e.target.value)}
                          placeholder="e.g., B-92M"
                        />
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Paint Finish:</strong></label>
                        <select
                          value={paintFinish}
                          onChange={(e) => setPaintFinish(e.target.value)}
                        >
                          {paintFinishes.map(finish => (
                            <option key={finish} value={finish}>{finish}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Paint Used (liters/ounces):</strong></label>
                        <input
                          type="text"
                          value={paintUsed}
                          onChange={(e) => setPaintUsed(e.target.value)}
                          placeholder="e.g., 2.5L"
                        />
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Masking Materials Used:</strong></label>
                        <input
                          type="text"
                          value={maskingUsed}
                          onChange={(e) => setMaskingUsed(e.target.value)}
                          placeholder="e.g., 3 rolls tape, 2 sheets paper"
                        />
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>Prep & Application Notes:</strong></label>
                        <textarea
                          value={prepNotes}
                          onChange={(e) => setPrepNotes(e.target.value)}
                          placeholder="Record sanding, primer coats, painting steps..."
                          rows="4"
                        />
                      </div>
                      
                      <div className="edit-group">
                        <label><strong>General Notes:</strong></label>
                        <textarea
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          placeholder="Additional notes..."
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
                          onClick={cancelEditingJob} 
                          className="cancel-btn"
                          disabled={savingJobId === job.id}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="view-section">
                      <div className="paint-specs">
                        <strong>Paint Specifications:</strong>
                        <div className="specs-grid">
                          <div><strong>Color:</strong> {job.paintColor || 'Not specified'}</div>
                          <div><strong>Code:</strong> {job.paintCode || 'Not specified'}</div>
                          <div><strong>Finish:</strong> {job.paintFinish || 'Not specified'}</div>
                          <div><strong>Used:</strong> {job.paintUsed || 'Not tracked'}</div>
                        </div>
                      </div>
                      
                      <div className="materials-section">
                        <strong>Materials Used:</strong>
                        <p><strong>Masking:</strong> {job.maskingUsed || 'Not tracked'}</p>
                      </div>
                      
                      <div className="notes-section">
                        <strong>Prep & Application Notes:</strong>
                        <p>{job.prepNotes || 'No prep notes'}</p>
                      </div>
                      
                      <div className="notes-section">
                        <strong>General Notes:</strong>
                        <p>{job.jobNotes || 'No notes'}</p>
                      </div>
                      
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
                            setShowDetailerAssign(true);
                          }}
                          className="handoff-btn"
                        >
                          Handoff to Detailer
                        </button>
                        <button 
                          onClick={() => {
                            setHandoffJobId(job.id);
                            setShowTechAssign(true);
                          }}
                          className="handoff-btn"
                        >
                          Handoff to Tech
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
                <button onClick={() => handoffToDetailer(handoffJobId)} className="save-btn" disabled={!selectedDetailer}>Assign & Advance</button>
                <button onClick={() => { setShowDetailerAssign(false); setHandoffJobId(null); setSelectedDetailer(''); }} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Tech Assignment Modal */}
        {showTechAssign && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Assign to Tech</h3>
              <p>Available techs: {techUsers.length}</p>
              <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)}>
                <option value="">Select Tech</option>
                {techUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
              {techUsers.length === 0 && (
                <p style={{color: 'red', fontSize: '12px'}}>No techs available. Please contact admin to add techs.</p>
              )}
              <div className="modal-actions">
                <button onClick={() => handoffToTech(handoffJobId)} className="save-btn" disabled={!selectedTech}>Assign & Handoff</button>
                <button onClick={() => { setShowTechAssign(false); setHandoffJobId(null); setSelectedTech(''); }} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PainterDashboard;
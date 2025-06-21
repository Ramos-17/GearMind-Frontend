// TODO: Detailer can send job back to Tech or to Painter
// TODO: Detailer can also mark job as completed
// TODO: If job is marked as 'Completed', it should appear in ManagerDashboard.jsx under 'Show Archived Jobs'
// TODO: Detailer should be able to add job notes and changes should be saved and the customer should be able to see the notes the employees put on the trackpage
// TODO: When job pages refreshes it should not restart the job

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import NavBar from '../components/NavBar';
import './DetailerDashboard.css';

function DetailerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [detailerUsers, setDetailerUsers] = useState([]);
  const [painterUsers, setPainterUsers] = useState([]);
  const [techUsers, setTechUsers] = useState([]);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedDetailer, setSelectedDetailer] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [savingJobId, setSavingJobId] = useState(null);
  const [showPainterAssign, setShowPainterAssign] = useState(false);
  const [showTechAssign, setShowTechAssign] = useState(false);
  const [handoffJobId, setHandoffJobId] = useState(null);
  const [selectedPainter, setSelectedPainter] = useState('');
  const [selectedTech, setSelectedTech] = useState('');

  // Detail-specific fields
  const [qualityRating, setQualityRating] = useState('GOOD');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [checklistItems, setChecklistItems] = useState({
    washExterior: false,
    vacuumInterior: false,
    cleanWindows: false,
    applyWax: false,
    polishPaint: false,
    cleanTires: false,
    detailEngine: false,
    finalInspection: false
  });

  // Calculate checklist completion percentage
  const getChecklistProgress = (checklist) => {
    const totalItems = Object.keys(checklist).length;
    const completedItems = Object.values(checklist).filter(Boolean).length;
    return Math.round((completedItems / totalItems) * 100);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('✨ Starting to fetch detail jobs...');
      console.log('✨ Current user from session storage:', sessionStorage.getItem('username'));
      console.log('✨ Current role from session storage:', sessionStorage.getItem('role'));
      console.log('✨ Token exists:', !!sessionStorage.getItem('token'));
      
      const allJobsData = await apiFetch('/api/jobs/all');
      console.log('✅ All jobs fetched successfully:', allJobsData);
      console.log('📊 Number of jobs:', allJobsData ? allJobsData.length : 'null/undefined');
      
      if (allJobsData && Array.isArray(allJobsData)) {
        // Filter for DETAIL jobs (not completed/archived)
        const detailJobs = allJobsData.filter(job => 
          job.currentStage === 'DETAIL' && !job.archived
        );
        
        console.log('✨ Filtered detail jobs:', detailJobs);
        console.log('✨ Number of detail jobs:', detailJobs.length);
        setJobs(detailJobs);
        setLastRefresh(new Date());
      } else {
        console.error(' Invalid job data received:', allJobsData);
        setError('Invalid job data received from server');
      }
    } catch (err) {
      console.error(' Error fetching jobs:', err);
      setError(err.message || 'Error fetching jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetailerUsers = useCallback(async () => {
    try {
      // Fetch detailer users from the backend
      const users = await apiFetch('/api/auth/users/detailer');
      if (users && Array.isArray(users)) {
        if (users.length === 0) {
          console.warn('No detailer users found in database, using fallback');
          setDetailerUsers(['detaileruser', 'detailer1', 'detailer2', 'detailer3']);
        } else {
          setDetailerUsers(users);
        }
      } else {
        console.warn('Invalid response format for detailer users:', users);
        setDetailerUsers([]);
      }
    } catch (err) {
      console.error('Error fetching detailer users:', err);
      setDetailerUsers([]);
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

  // Fetch tech users for handoff
  const fetchTechUsers = useCallback(async () => {
    try {
      console.log('🔧 Fetching tech users...');
      const users = await apiFetch('/api/auth/users/tech');
      console.log('🔧 Tech users fetched:', users);
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

  // Get current user from session storage
  useEffect(() => {
    const username = sessionStorage.getItem('username') || 'Detailer';
    const role = sessionStorage.getItem('role');
    const token = sessionStorage.getItem('token');
    
    console.log('🔐 DetailerDashboard - Current session info:');
    console.log('  Username:', username);
    console.log('  Role:', role);
    console.log('  Token exists:', !!token);
    console.log('  Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
    
    setCurrentUser(username);
  }, []);

  // Load users on component mount
  useEffect(() => {
    fetchDetailerUsers();
    fetchPainterUsers();
    fetchTechUsers();
  }, [fetchDetailerUsers, fetchPainterUsers, fetchTechUsers]);

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

      console.log('💾 Updating job:', jobId, 'with updates:', updates);
      console.log('🔐 Current user:', currentUser);
      console.log('🔐 Token exists:', !!sessionStorage.getItem('token'));
      
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
      setSelectedDetailer('');
      setQualityRating('GOOD');
      setInspectionNotes('');
      setPickupInstructions('');
      setCustomerContact('');
      setChecklistItems({
        washExterior: false,
        vacuumInterior: false,
        cleanWindows: false,
        applyWax: false,
        polishPaint: false,
        cleanTires: false,
        detailEngine: false,
        finalInspection: false
      });
    } catch (err) {
      console.error('❌ Error updating job:', err);
      
      // Provide more specific error messages
      if (err.message && err.message.includes('403')) {
        setError('Access forbidden. You may not have permission to update this job.');
      } else if (err.message && err.message.includes('404')) {
        setError('Job not found. It may have been deleted or moved.');
      } else if (err.message && err.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || 'Error updating job. Please check your connection and try again.');
      }
    } finally {
      setSavingJobId(null);
    }
  };

  const startEditingJob = (job) => {
    setEditingJobId(job.id);
    setEditingNotes(job.jobNotes || '');
    setSelectedStage(job.currentStage);
    setSelectedDetailer(job.assignedTechnician || '');
    setQualityRating(job.qualityRating || 'GOOD');
    setInspectionNotes(job.inspectionNotes || '');
    setPickupInstructions(job.pickupInstructions || '');
    setCustomerContact(job.customerContact || '');
    
    // Parse checklist items from JSON string or use default
    let checklist = {
      washExterior: false,
      vacuumInterior: false,
      cleanWindows: false,
      applyWax: false,
      polishPaint: false,
      cleanTires: false,
      detailEngine: false,
      finalInspection: false
    };
    
    if (job.checklistItems) {
      try {
        const parsedChecklist = JSON.parse(job.checklistItems);
        checklist = { ...checklist, ...parsedChecklist };
      } catch (e) {
        console.warn('Failed to parse checklist items:', e);
      }
    }
    
    setChecklistItems(checklist);
  };

  const cancelEditingJob = () => {
    setEditingJobId(null);
    setEditingNotes('');
    setSelectedStage('');
    setSelectedDetailer('');
    setQualityRating('GOOD');
    setInspectionNotes('');
    setPickupInstructions('');
    setCustomerContact('');
    setChecklistItems({
      washExterior: false,
      vacuumInterior: false,
      cleanWindows: false,
      applyWax: false,
      polishPaint: false,
      cleanTires: false,
      detailEngine: false,
      finalInspection: false
    });
  };

  const handleChecklistChange = (item, checked) => {
    setChecklistItems(prev => ({
      ...prev,
      [item]: checked
    }));
  };

  const saveJobChanges = async (jobId) => {
    const updates = {};
    
    if (editingNotes !== '') {
      updates.jobNotes = editingNotes;
    }
    
    if (selectedStage && selectedStage !== '') {
      updates.currentStage = selectedStage;
    }
    
    if (selectedDetailer && selectedDetailer !== '') {
      updates.assignedTechnician = selectedDetailer;
    }

    // Detail-specific fields
    if (qualityRating !== 'GOOD') {
      updates.qualityRating = qualityRating;
    }
    if (inspectionNotes !== '') {
      updates.inspectionNotes = inspectionNotes;
    }
    if (pickupInstructions !== '') {
      updates.pickupInstructions = pickupInstructions;
    }
    if (customerContact !== '') {
      updates.customerContact = customerContact;
    }
    
    // Convert checklist to JSON string
    const checklistJson = JSON.stringify(checklistItems);
    updates.checklistItems = checklistJson;

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

  const qualityRatings = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
  const detailStages = ['DETAIL'];

  const checklistLabels = {
    washExterior: 'Wash Exterior',
    vacuumInterior: 'Vacuum Interior',
    cleanWindows: 'Clean Windows',
    applyWax: 'Apply Wax/Sealant',
    polishPaint: 'Polish Paint',
    cleanTires: 'Clean Tires & Wheels',
    detailEngine: 'Detail Engine Bay',
    finalInspection: 'Final Quality Inspection'
  };

  return (
    <div className="dashboard-container">
      <NavBar />
      <div className="detailer-dashboard">
        <div className="dashboard-header">
      <h1>Detailer Dashboard</h1>
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
              placeholder="Search by customer or vehicle..."
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
              <option value="ALL">All Detail Jobs</option>
              <option value="DETAIL">Detail</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="last-refresh">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>

        {loading && <div className="loading">Loading detail jobs...</div>}

        {!loading && jobs.length === 0 && (
          <div className="no-jobs">
            <p>No detail jobs found.</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="jobs-grid">
            {jobs.map((job) => {
              // Parse checklist for display
              let jobChecklist = {
                washExterior: false,
                vacuumInterior: false,
                cleanWindows: false,
                applyWax: false,
                polishPaint: false,
                cleanTires: false,
                detailEngine: false,
                finalInspection: false
              };
              
              if (job.checklistItems) {
                try {
                  if (typeof job.checklistItems === 'string') {
                    jobChecklist = JSON.parse(job.checklistItems);
                  } else {
                    jobChecklist = job.checklistItems;
                  }
                } catch (e) {
                  console.error('Error parsing checklist items:', e);
                }
              }
              
              const checklistProgress = getChecklistProgress(jobChecklist);
              
              return (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div className="job-title">
                      <h3>{job.customerName}</h3>
                      <span className={`job-stage ${job.currentStage.toLowerCase()}`}>
                        {job.currentStage}
                      </span>
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
                      <span><strong>Detailer:</strong> {job.assignedTechnician || 'Unassigned'}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span><strong>Paint Status:</strong> {job.paintColor || 'Not specified'}</span>
                      <span><strong>Quality Rating:</strong> {job.qualityRating || 'Not rated'}</span>
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
                            {detailStages.map(stage => (
                              <option key={stage} value={stage}>{stage}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="edit-group">
                          <label><strong>Assign To:</strong></label>
                          <select
                            value={selectedDetailer}
                            onChange={(e) => setSelectedDetailer(e.target.value)}
                          >
                            <option value="">Keep current</option>
                            {detailerUsers.map(user => (
                              <option key={user} value={user}>{user}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="edit-group">
                          <label><strong>Quality Rating:</strong></label>
                          <select
                            value={qualityRating}
                            onChange={(e) => setQualityRating(e.target.value)}
                          >
                            {qualityRatings.map(rating => (
                              <option key={rating} value={rating}>{rating}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="edit-group">
                          <label><strong>Customer Contact:</strong></label>
                          <input
                            type="text"
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            placeholder="Phone number or email"
                          />
                        </div>
                        
                        <div className="edit-group">
                          <label><strong>Pickup Instructions:</strong></label>
                          <input
                            type="text"
                            value={pickupInstructions}
                            onChange={(e) => setPickupInstructions(e.target.value)}
                            placeholder="e.g., Call when ready, specific time, etc."
                          />
                        </div>
                        
                        <div className="edit-group">
                          <label><strong>Quality Inspection Notes:</strong></label>
                          <textarea
                            value={inspectionNotes}
                            onChange={(e) => setInspectionNotes(e.target.value)}
                            placeholder="Record any touch-ups needed, paint blemishes, upholstery spots..."
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
                        
                        <div className="edit-group">
                          <label><strong>Detailing Checklist:</strong></label>
                          <div className="checklist-grid">
                            {Object.entries(checklistLabels).map(([key, label]) => (
                              <label key={key} className="checklist-item">
                                <input
                                  type="checkbox"
                                  checked={checklistItems[key]}
                                  onChange={(e) => handleChecklistChange(key, e.target.checked)}
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
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
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="view-section">
                        <div className="checklist-section">
                          <strong>Detailing Checklist ({checklistProgress}% Complete):</strong>
                          <div className="checklist-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${checklistProgress}%` }}
                              ></div>
                            </div>
                            <span>{checklistProgress}%</span>
                          </div>
                          <div className="checklist-items">
                            {Object.entries(checklistLabels).map(([key, label]) => (
                              <div key={key} className={`checklist-item ${jobChecklist[key] ? 'completed' : ''}`}>
                                <span className="check-icon">
                                  {jobChecklist[key] ? '✅' : '⭕'}
                                </span>
                                <span>{label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="quality-section">
                          <strong>Quality Inspection:</strong>
                          <div className="quality-info">
                            <div><strong>Rating:</strong> {job.qualityRating || 'Not rated'}</div>
                            <div><strong>Notes:</strong> {job.inspectionNotes || 'No inspection notes'}</div>
                          </div>
                        </div>
                        
                        <div className="pickup-section">
                          <strong>Customer Pickup:</strong>
                          <div className="pickup-info">
                            <div><strong>Contact:</strong> {job.customerContact || 'Not specified'}</div>
                            <div><strong>Instructions:</strong> {job.pickupInstructions || 'No pickup instructions'}</div>
                          </div>
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
                            Mark Detail Complete
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
              );
            })}
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

export default DetailerDashboard;
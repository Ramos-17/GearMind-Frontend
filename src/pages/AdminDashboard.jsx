import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import NavBar from '../components/NavBar';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [editingNotes, setEditingNotes] = useState({});
  const [isEditingNotes, setIsEditingNotes] = useState({});

  const [newEmployeeUsername, setNewEmployeeUsername] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState('ROLE_ADMIN');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const [newJobCustomer, setNewJobCustomer] = useState('');
  const [newJobVehicle, setNewJobVehicle] = useState('');
  const [newJobTechnician, setNewJobTechnician] = useState('');
  const [newJobNotes, setNewJobNotes] = useState('');
  const [jobError, setJobError] = useState('');
  const [jobSuccess, setJobSuccess] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { fetchAllUsers(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/jobs/all');
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Error fetching jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const users = await apiFetch('/api/auth/users/all');
      setAllUsers(users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const deleteUser = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }
    
    try {
      await apiFetch(`/api/auth/users/${username}`, { method: 'DELETE' });
      setRegSuccess(`User "${username}" deleted successfully`);
      fetchAllUsers(); // Refresh the users list
    } catch (err) {
      setRegError(err.message || 'Error deleting user');
    }
  };

  const handleRegister = async () => {
    setRegError(''); setRegSuccess('');
    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ username: newEmployeeUsername, password: newEmployeePassword, role: newEmployeeRole }) });
      setRegSuccess('User registered successfully');
      setNewEmployeeUsername(''); setNewEmployeePassword('');
    } catch (err) {
      setRegError(err.message || 'Registration failed');
    }
  };

  const handleCreateJob = async () => {
    setJobError('');
    setJobSuccess('');
    try {
      await apiFetch('/api/jobs/create', { method: 'POST', body: JSON.stringify({ customerName: newJobCustomer, vehicleInfo: newJobVehicle, assignedTechnician: newJobTechnician, jobNotes: newJobNotes }) });
      setJobSuccess('Job created successfully');
      setNewJobCustomer(''); 
      setNewJobVehicle(''); 
      setNewJobTechnician(''); 
      setNewJobNotes('');
      fetchJobs();
    } catch (err) {
      setJobError(err.message || 'Error creating job');
    }
  };

  const deleteJob = async (id) => {
    try { await apiFetch(`/api/jobs/${id}`, { method: 'DELETE' }); if (id === selectedJobId) setSelectedJobId(''); fetchJobs(); } catch (err) { setError(err.message || 'Error deleting job'); }
  };

  const updateJobNotes = async (id) => {
    try { 
      const notes = editingNotes[id] || ''; 
      await apiFetch(`/api/jobs/${id}/update-notes`, { method: 'PUT', body: JSON.stringify({ jobNotes: notes }) }); 
      setIsEditingNotes(prev => ({ ...prev, [id]: false }));
      fetchJobs(); 
    } catch (err) { 
      setError(err.message || 'Error updating notes'); 
    }
  };

  const startEditingNotes = (id, currentNotes) => {
    const notesText = typeof currentNotes === 'string' ? currentNotes : getNotesText({ jobNotes: currentNotes });
    setEditingNotes(prev => ({ ...prev, [id]: notesText }));
    setIsEditingNotes(prev => ({ ...prev, [id]: true }));
  };

  const cancelEditingNotes = (id) => {
    setIsEditingNotes(prev => ({ ...prev, [id]: false }));
  };

  const handleSelectChange = (e) => setSelectedJobId(e.target.value);
  const selectedJob = jobs.find(j => String(j.id) === selectedJobId);
  const getLastName = (fullName) => { const parts = fullName.trim().split(' '); return parts.length > 1 ? parts.pop() : fullName; };

  // Helper function to safely extract notes text
  const getNotesText = (job) => {
    if (!job || !job.jobNotes) return 'No notes';
    
    let notes = job.jobNotes;
    
    // If notes is a JSON string, try to parse it
    if (typeof notes === 'string' && notes.startsWith('{')) {
      try {
        const parsed = JSON.parse(notes);
        notes = parsed.jobNotes || parsed.notes || parsed.text || notes;
      } catch {
        // If parsing fails, use the original string
        notes = job.jobNotes;
      }
    }
    
    // If notes is an object, try to extract the text
    if (typeof notes === 'object') {
      notes = notes.jobNotes || notes.notes || notes.text || JSON.stringify(notes);
    }
    
    // Return the cleaned string
    return (typeof notes === 'string' ? notes.trim() : String(notes)) || 'No notes';
  };

  return (
    <div className="admin-container">
      <NavBar />
      <h1 className="admin-title">Admin Dashboard</h1>
      {error && <div className="error">{error}</div>}

      {/* Row: Registration & Dropdown */}
      <div className="form-row">
        <section className="form-section">
          <h2>Register New User</h2>
          {regError && <div className="error">{regError}</div>}
          {regSuccess && <div className="success">{regSuccess}</div>}
          <input placeholder="Username" value={newEmployeeUsername} onChange={e => setNewEmployeeUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={newEmployeePassword} onChange={e => setNewEmployeePassword(e.target.value)} />
          <select value={newEmployeeRole} onChange={e => setNewEmployeeRole(e.target.value)}>
            <option value="ROLE_ADMIN">Admin</option>
            <option value="ROLE_MANAGER">Manager</option>
            <option value="ROLE_TECH">Tech</option>
            <option value="ROLE_PAINTER">Painter</option>
            <option value="ROLE_DETAILER">Detailer</option>
          </select>
          <button onClick={handleRegister}>Register</button>
        </section>

        <section className="form-section dropdown-section">
          <h2>Select Job by Last Name</h2>
          {loading ? <p>Loading...</p> : (
            <select value={selectedJobId} onChange={handleSelectChange}>
              <option value="">-- Select --</option>
              {jobs.map(job => <option key={job.id} value={job.id}>{getLastName(job.customerName)}</option>)}
            </select>
          )}

          {/* Selected Job Details placed here under the dropdown */}
          {selectedJob && (
            <div className="job-detail-card">
              <h3>Details for {selectedJob.customerName || 'N/A'}</h3>
              <p><strong>Vehicle:</strong> {selectedJob.vehicleInfo || 'N/A'}</p>
              <p><strong>Stage:</strong> {selectedJob.currentStage || 'N/A'}</p>
              <p><strong>Technician:</strong> {selectedJob.assignedTechnician || 'Unassigned'}</p>
              <p>
                <strong>Notes:</strong> 
                {isEditingNotes[selectedJob.id] ? (
                  <textarea
                    value={editingNotes[selectedJob.id] ?? selectedJob.jobNotes ?? ''}
                    onChange={e => setEditingNotes(prev => ({ ...prev, [selectedJob.id]: e.target.value }))}
                  />
                ) : (
                  <span className="notes-text">{getNotesText(selectedJob) || 'No notes'}</span>
                )}
              </p>
              {isEditingNotes[selectedJob.id] ? (
                <div className="button-group">
                  <button onClick={() => updateJobNotes(selectedJob.id)}>Update Notes</button>
                  <button onClick={() => cancelEditingNotes(selectedJob.id)}>Cancel</button>
                </div>
              ) : (
                <div className="button-group">
                  <button onClick={() => startEditingNotes(selectedJob.id, selectedJob.jobNotes)}>Edit Notes</button>
                  <button onClick={() => deleteJob(selectedJob.id)}>Delete Job</button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Create Job Section */}
        <section className="form-section create-job-section">
          <h2>Create New Job</h2>
          {jobError && <div className="error">{jobError}</div>}
          {jobSuccess && <div className="success">{jobSuccess}</div>}
          <input placeholder="Customer Name" value={newJobCustomer} onChange={e => setNewJobCustomer(e.target.value)} />
          <input placeholder="Vehicle Info" value={newJobVehicle} onChange={e => setNewJobVehicle(e.target.value)} />
          <input placeholder="Assigned Technician" value={newJobTechnician} onChange={e => setNewJobTechnician(e.target.value)} />
          <textarea placeholder="Job Notes" value={newJobNotes} onChange={e => setNewJobNotes(e.target.value)} />
          <button onClick={handleCreateJob}>Create Job</button>
        </section>

        {/* Debug: Show All Users */}
        <section className="form-section debug-section">
          <h2>All Users</h2>
          <div className="users-list">
            {allUsers.length === 0 ? (
              <p>No users found in system</p>
            ) : (
              allUsers.map(user => (
                <div key={user.id} className="user-item">
                  <strong>{user.username}</strong> - {user.role}
                  <button onClick={() => deleteUser(user.username)}>Delete</button>
                </div>
              ))
            )}
          </div>
          <button onClick={fetchAllUsers}>Refresh Users</button>
        </section>
      </div>
    </div>
  );
}

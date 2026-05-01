import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
      setIsAdmin(res.data.currentUserRole === 'ADMIN');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setCreatingTask(true);
    try {
      await api.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate || null,
        assignedToId: taskAssignee || null,
        projectId
      });
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskDueDate('');
      setTaskAssignee('');
      setShowTaskModal(false);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setAddingMember(true);
    try {
      await api.post(`/projects/${projectId}/members`, { email: memberEmail });
      setMemberEmail('');
      setShowMemberModal(false);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'HIGH') return 'bg-red-100 text-red-600';
    if (priority === 'MEDIUM') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusColor = (status) => {
    if (status === 'DONE') return 'bg-green-100 text-green-700';
    if (status === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  const todoTasks = project?.tasks?.filter(t => t.status === 'TODO') || [];
  const inProgressTasks = project?.tasks?.filter(t => t.status === 'IN_PROGRESS') || [];
  const doneTasks = project?.tasks?.filter(t => t.status === 'DONE') || [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"/>
    </div>
  );

  if (!project) return (
    <div className="p-8 text-center text-slate-500">Project not found</div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
          >
            ← Back to Projects
          </button>
          <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
          <p className="text-slate-500 mt-1">{project.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowMemberModal(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-lg border border-slate-200 transition-colors text-sm"
              >
                + Add Member
              </button>
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                + New Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Team Members</h2>
        <div className="flex flex-wrap gap-3">
          {project.members?.map(member => (
            <div key={member.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs">
                {member.user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{member.user?.name}</p>
                <p className="text-xs text-slate-500">{member.role}</p>
              </div>
              {isAdmin && member.user?.id !== user?.id && (
                <button
                  onClick={() => handleRemoveMember(member.user?.id)}
                  className="ml-2 text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* To Do Column */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-slate-400"/>
            <h3 className="font-semibold text-slate-700">To Do</h3>
            <span className="ml-auto text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
              {todoTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {todoTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                user={user}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-blue-500"/>
            <h3 className="font-semibold text-slate-700">In Progress</h3>
            <span className="ml-auto text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {inProgressTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                user={user}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500"/>
            <h3 className="font-semibold text-slate-700">Done</h3>
            <span className="ml-auto text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">
              {doneTasks.length}
            </span>
          </div>
          <div className="space-y-3">
            {doneTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                user={user}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Delete Project */}
      {isAdmin && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={handleDeleteProject}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            🗑️ Delete this project
          </button>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Create New Task</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Task title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                <select
                  value={taskAssignee}
                  onChange={e => setTaskAssignee(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {project.members?.map(member => (
                    <option key={member.user?.id} value={member.user?.id}>
                      {member.user?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowTaskModal(false); setError(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {creatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Add Team Member</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Member Email
                </label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="teammate@example.com"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  They must already have a TaskFlow account
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowMemberModal(false); setError(''); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({ task, isAdmin, user, onStatusChange, onDelete, getPriorityColor, getStatusColor }) {
  const canUpdate = isAdmin || task.assignedTo?.id === user?.id;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-800 flex-1">{task.title}</h4>
        {isAdmin && (
          <button
            onClick={() => onDelete(task.id)}
            className="text-slate-300 hover:text-red-500 transition-colors ml-2 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-3">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.assignedTo && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs">
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-xs text-slate-600">{task.assignedTo.name}</span>
        </div>
      )}

      {canUpdate && (
        <select
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value)}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"/>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Good morning, {user?.name}! 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening across your projects</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Projects</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{stats?.totalProjects || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Tasks</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{stats?.totalTasks || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats?.byStatus?.IN_PROGRESS || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Overdue</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{stats?.overdueTasks || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Task Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Tasks by Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"/>
                <span className="text-sm text-slate-600">To Do</span>
              </div>
              <span className="font-semibold text-slate-800">{stats?.byStatus?.TODO || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"/>
                <span className="text-sm text-slate-600">In Progress</span>
              </div>
              <span className="font-semibold text-slate-800">{stats?.byStatus?.IN_PROGRESS || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"/>
                <span className="text-sm text-slate-600">Done</span>
              </div>
              <span className="font-semibold text-slate-800">{stats?.byStatus?.DONE || 0}</span>
            </div>
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">My Tasks</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">To Do</span>
              <span className="font-semibold text-slate-800">{stats?.myTasks?.TODO || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">In Progress</span>
              <span className="font-semibold text-slate-800">{stats?.myTasks?.IN_PROGRESS || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Done</span>
              <span className="font-semibold text-slate-800">{stats?.myTasks?.DONE || 0}</span>
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        {stats?.overdueTasksList?.length > 0 && (
          <div className="bg-white rounded-xl border border-red-200 p-6 md:col-span-2">
            <h2 className="font-semibold text-red-600 mb-4">⚠️ Overdue Tasks</h2>
            <div className="space-y-2">
              {stats.overdueTasksList.map(task => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.project?.name}</p>
                  </div>
                  <span className="text-xs text-red-500">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks by User */}
        {stats?.tasksByUser?.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2">
            <h2 className="font-semibold text-slate-800 mb-4">Tasks per Team Member</h2>
            <div className="space-y-2">
              {stats.tasksByUser.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-700">{u.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{u.count} tasks</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
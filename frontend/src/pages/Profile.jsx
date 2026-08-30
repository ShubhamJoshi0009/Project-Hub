import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContextInstance';
import { getProjects, updateProfile, uploadAvatar } from '../api';
import { 
  User, Mail, Calendar, Briefcase, CheckCircle2, 
  Camera, Sparkles, Phone, Shield, Save, Check
} from 'lucide-react';
import { useToast } from '../components/Toast';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const toast = useToast();

  const [stats, setStats] = useState({ total: 0, completed: 0, projectsCount: 0 });
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setJobTitle(user.job_title || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getProjects();
        const projects = response.data || [];
        let totalTasks = 0;
        let completedTasks = 0;
        projects.forEach((p) => {
          totalTasks += p.tasks?.length || 0;
          completedTasks += p.tasks?.filter((t) => t.status === 'Done').length || 0;
        });
        setStats({ total: totalTasks, completed: completedTasks, projectsCount: projects.length });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateProfile({
        name,
        job_title: jobTitle,
        bio,
        phone
      });
      if (updateUser) updateUser(res.data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await uploadAvatar(formData);
      if (updateUser) updateUser({ avatar_url: res.data.avatar_url });
      toast.success('Profile avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const efficiencyRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="p-6 md:p-8 flex-1 bg-slate-950 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">
            Account & Profile
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            Manage your personal profile, credentials, and work statistics.
          </p>
        </div>

        {/* Profile Card */}
        <div 
          className="rounded-3xl shadow-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {/* Header Banner */}
          <div className="h-48 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500 rounded-full blur-3xl -ml-24 -mb-24" />
            </div>
          </div>

          <div className="px-8 pb-10">
            {/* Avatar & Basic Info */}
            <div className="relative -mt-16 mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-6">
              <div className="relative group">
                <div className="h-32 w-32 rounded-3xl p-1.5 shadow-2xl bg-slate-900 border-2 border-emerald-500/30 overflow-hidden">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name} 
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-4xl font-black shadow-inner">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Upload Avatar overlay button */}
                <label className={`absolute inset-0 rounded-3xl bg-black/60 flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                  isUploadingAvatar ? 'opacity-100' : ''
                }`}>
                  <Camera className="h-6 w-6 mb-1 text-emerald-400" />
                  <span>{isUploadingAvatar ? 'Saving...' : 'Upload'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                </label>
              </div>

              <div className="pb-2 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-100">{user.name}</h2>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Pro Member
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800">
                <div className="flex items-center text-emerald-400 mb-2">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span className="font-black uppercase tracking-widest text-[10px]">Projects</span>
                </div>
                <p className="text-2xl font-black text-slate-100">{stats.projectsCount}</p>
              </div>

              <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800">
                <div className="flex items-center text-teal-400 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="font-black uppercase tracking-widest text-[10px]">Total Tasks</span>
                </div>
                <p className="text-2xl font-black text-slate-100">{stats.total}</p>
              </div>

              <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800">
                <div className="flex items-center text-emerald-400 mb-2">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span className="font-black uppercase tracking-widest text-[10px]">Completed</span>
                </div>
                <p className="text-2xl font-black text-slate-100">{stats.completed}</p>
              </div>

              <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800">
                <div className="flex items-center text-amber-400 mb-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="font-black uppercase tracking-widest text-[10px]">Efficiency</span>
                </div>
                <p className="text-2xl font-black text-slate-100">{efficiencyRate}%</p>
              </div>
            </div>

            {/* Edit Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-base font-black text-slate-200">Personal Information</h3>
                <span className="text-xs text-slate-400">Manage how you appear across projects</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl px-4 py-3 border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Engineer, Product Designer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl px-4 py-3 border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Email Address (Account ID)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full text-xs font-semibold rounded-xl px-4 py-3 border opacity-60 cursor-not-allowed"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl px-4 py-3 border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    Bio / About
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Tell your team about yourself, timezone, or working hours..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl px-4 py-3 border outline-none resize-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

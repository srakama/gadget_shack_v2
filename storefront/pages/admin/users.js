import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { apiClient, formatPrice, formatDate } from '../../lib/api';
import toast from 'react-hot-toast';
import { requireAdminSSR } from './_guard';

export const getServerSideProps = (ctx) => requireAdminSSR(ctx);

export default function AdminUsersPage({ serverRole }) {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    role: 'customer'
  });

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (roleFilter) params.role = roleFilter;
      
      const data = await apiClient.getAdminUsers(params);
      setUsers(data.users || []);
      setPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: '#ef4444',
      customer: '#3b82f6',
    };
    return colors[role] || '#6b7280';
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      role: 'customer'
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      email: user.email || '',
      password: '', // Don't pre-fill password
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      province: user.province || '',
      postal_code: user.postal_code || '',
      role: user.role || 'customer'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (modalMode === 'create' && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      setLoading(true);

      if (modalMode === 'create') {
        await apiClient.createUser(formData);
        toast.success('User created successfully!');
      } else {
        // Only send fields that have values
        const updateData = {};
        Object.keys(formData).forEach(key => {
          if (formData[key] && formData[key].trim()) {
            updateData[key] = formData[key];
          }
        });

        await apiClient.updateUser(selectedUser.id, updateData);
        toast.success('User updated successfully!');
      }

      closeModal();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteUser(user.id);
      toast.success('User deleted successfully!');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Admin • Users" serverRole={serverRole}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <h1 style={{ marginBottom: '2rem' }}>User Management</h1>

        {/* Filters and Actions */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label>Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Users</option>
            <option value="admin">Admins</option>
            <option value="customer">Customers</option>
          </select>
          <span style={{ marginLeft: 'auto', color: '#666' }}>
            Total: {total} users
          </span>
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            style={{ marginLeft: '1rem' }}
          >
            + Create User
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <p>No users found</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Role</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Orders</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Total Spent</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Joined</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '1rem' }}>
                        <strong>#{user.id}</strong>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {user.first_name} {user.last_name}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          background: getRoleBadgeColor(user.role) + '20',
                          color: getRoleBadgeColor(user.role),
                          textTransform: 'capitalize',
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {user.order_count || 0}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatPrice(user.total_spent || 0)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {formatDate(user.created_at)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => openEditModal(user)}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.875rem',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.875rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                  style={{ opacity: page === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="btn btn-secondary"
                  style={{ opacity: page === pages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Back to Dashboard */}
        <div style={{ marginTop: '2rem' }}>
          <a href="/admin" className="btn btn-secondary">
            ← Back to Dashboard
          </a>
        </div>

        {/* Create/Edit User Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem' }}>
                {modalMode === 'create' ? 'Create New User' : 'Edit User'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="user@example.com"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Password {modalMode === 'create' ? '*' : '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleFormChange}
                      required={modalMode === 'create'}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder={modalMode === 'create' ? 'Enter password' : 'Leave blank to keep current'}
                    />
                  </div>

                  {/* First Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="John"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="Doe"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      placeholder="+27123456789"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (modalMode === 'create' ? 'Create User' : 'Update User')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


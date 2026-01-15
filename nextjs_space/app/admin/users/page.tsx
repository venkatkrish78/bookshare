'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Users, ArrowLeft, Ban, CheckCircle, Shield, Edit2, Trash2, X, Check, Search } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function UsersManagementPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!user.isAdmin) {
        router.push('/')
      } else {
        fetchUsers()
      }
    }
  }, [user, authLoading])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data?.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDisable = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isDisabled: !currentStatus })
      })

      if (res.ok) {
        toast.success(currentStatus ? 'User enabled' : 'User disabled')
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to update user')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEdit = async (userId: string) => {
    if (!editingUser) return
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      })

      if (res.ok) {
        toast.success('User updated successfully')
        setEditingUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to update user')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('User deleted successfully')
        setDeleteConfirm(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user?.isAdmin) return null

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">{users?.length} registered user{users?.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers?.map((u, index) => (
                  <motion.tr
                    key={u?.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      {editingUser?.id === u.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Email"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{u?.name}</p>
                          </div>
                          <p className="text-sm text-gray-500">{u?.email}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                          u?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {u?.emailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                        {u?.isDisabled && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 w-fit">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser?.id === u.id && user?.id !== u.id ? (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editingUser.isAdmin}
                            onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm">Admin</span>
                        </label>
                      ) : (
                        <div className="flex items-center">
                          {u?.isAdmin && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              <Shield className="h-3 w-3 mr-1" /> Admin
                            </span>
                          )}
                          {!u?.isAdmin && (
                            <span className="text-sm text-gray-500">Member</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <div>{u?._count?.ownedBooks || 0} books</div>
                        <div>{u?._count?.loans || 0} loans</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u?.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {editingUser?.id === u.id ? (
                          <>
                            <button
                              onClick={() => handleEdit(u.id)}
                              disabled={actionLoading === u.id}
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : deleteConfirm === u.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(u.id)}
                              disabled={actionLoading === u.id}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUser({
                                id: u.id,
                                name: u.name,
                                email: u.email,
                                isAdmin: u.isAdmin,
                                isDisabled: u.isDisabled
                              })}
                              className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {!u?.isAdmin && (
                              <>
                                <button
                                  onClick={() => handleToggleDisable(u?.id, u?.isDisabled)}
                                  disabled={actionLoading === u?.id}
                                  className={`p-1.5 rounded-lg disabled:opacity-50 ${
                                    u?.isDisabled
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  }`}
                                  title={u?.isDisabled ? 'Enable' : 'Disable'}
                                >
                                  {u?.isDisabled ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(u.id)}
                                  className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {u?.isAdmin && user?.id !== u.id && (
                              <button
                                onClick={() => setDeleteConfirm(u.id)}
                                className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No users found matching your search
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

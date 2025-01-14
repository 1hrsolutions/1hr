import React, { useState, useEffect } from 'react';
import { useUserContext } from '../contexts/UserContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ClientList = () => {
  const { user, loading: userLoading } = useUserContext();
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false);

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  const OverlayLoader = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    </div>
  );

  const fetchClients = async () => {
    if (!isSorting) {
      setIsLoading(true);
    }
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/client`, {
        params: {
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder,
          name: nameFilter,
          email: emailFilter
        }
      });
      setClients(response.data.clients);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Failed to fetch clients');
    } finally {
      setIsLoading(false);
      setIsSorting(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [currentPage, sortBy, sortOrder, nameFilter, emailFilter]);

  const handleSort = (field) => {
    setIsSorting(true);
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleAddClient = () => {
    setCurrentClient({ name: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const handleEditClient = (index) => {
    if (index >= 0 && index < clients.length) {
      setCurrentClient({ ...clients[index], index });
      setIsModalOpen(true);
    } else {
      console.error('Invalid client index:', index);
      alert('Error opening edit modal');
    }
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setIsLoading(true);
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/user/${id}`, {
          data: { type: 'client' }
        });
        setClients(clients.filter(client => client._id !== id));
        alert('Client deleted successfully');
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveClient = async () => {
    setIsLoading(true);
    try {
      if (currentClient.index !== undefined) {
        // Update existing client
        const clientId = clients[currentClient.index]?._id;
        if (!clientId) {
          throw new Error('Client ID not found');
        }
        const response = await axios.patch(`${process.env.REACT_APP_API_URL}/api/user/${clientId}`, {
          name: currentClient.name,
          email: currentClient.email,
          type: 'client'
        });
        setClients(prevClients => {
          const updatedClients = [...prevClients];
          updatedClients[currentClient.index] = response.data.user;
          return updatedClients;
        });
        alert('Client updated successfully');
      } else {
        // Add new client
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/user/signup`, {
          ...currentClient,
          type: 'client'
        });
        const newUser = response.data.user;
        if (newUser && newUser._id) {
          setClients(prevClients => [...prevClients, newUser]);
          alert('New client added successfully');
        } else {
          throw new Error('Incomplete user data received from server');
        }
      }
      setIsModalOpen(false);
      setCurrentClient(null);
      await fetchClients(); // Refresh the client list
    } catch (error) {
      console.error('Error saving client:', error);
      alert(error.message || 'Failed to save client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }
    setIsLoading(true);
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/api/user/update-password/${clients[currentClient.index]._id}`, {
        newPassword: newPassword,
        type: 'client'
      });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError('Failed to update password');
      alert('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if ((userLoading || isLoading) && !isSorting) {
    return <OverlayLoader />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-primary mb-8">Client Management</h1>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 bg-primary">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Client List</h2>
              <button
                onClick={handleAddClient}
                className="bg-white text-primary px-4 py-2 rounded-full font-medium hover:bg-purple-100 transition duration-300 ease-in-out"
              >
                Add New Client
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex mb-4 space-x-4">
              <input
                type="text"
                placeholder="Filter by name"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Filter by email"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      Email {sortBy === 'email' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-purple-200">
                  {clients.map((client, index) => (
                    <tr key={client._id} className="hover:bg-purple-50 transition duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center">
                          <div className="relative group">
                            <button
                              onClick={() => handleEditClient(index)}
                              className="text-primary hover:text-purple-700 transition duration-300 ease-in-out mr-2"
                              aria-label="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Edit Client
                            </span>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => handleDeleteClient(client._id)}
                              className="text-red-500 hover:text-red-700 transition duration-300 ease-in-out"
                              aria-label="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Delete Client
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 flex justify-between items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-primary">
              {currentClient.index !== undefined ? 'Edit Client' : 'Add New Client'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Name</label>
                <input
                  type="text"
                  value={currentClient.name}
                  onChange={(e) =>
                    setCurrentClient({ ...currentClient, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Email</label>
                <input
                  type="email"
                  value={currentClient.email}
                  onChange={(e) =>
                    setCurrentClient({ ...currentClient, email: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
                />
              </div>
              {currentClient.index === undefined && (
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={currentClient.password}
                      onChange={(e) =>
                        setCurrentClient({ ...currentClient, password: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded font-medium text-gray-600 hover:bg-gray-100 transition duration-300 ease-in-out"
              >
                Cancel
              </button>
              {currentClient.index !== undefined && (
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 rounded font-medium bg-primary text-white hover:bg-purple-700 transition duration-300 ease-in-out"
                >
                  Change Password
                </button>
              )}
              <button
                onClick={handleSaveClient}
                className="px-4 py-2 rounded font-medium bg-primary text-white hover:bg-purple-700 transition duration-300 ease-in-out"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-primary">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-gray-800"
                />
              </div>
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="px-4 py-2 rounded font-medium text-gray-600 hover:bg-gray-100 transition duration-300 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                className="px-4 py-2 rounded font-medium bg-primary text-white hover:bg-purple-700 transition duration-300 ease-in-out"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;

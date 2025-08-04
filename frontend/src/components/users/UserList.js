import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Dropdown, Modal, Alert, Spinner, Pagination, Tooltip } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaToggleOn, FaToggleOff, FaUserTag, FaUsersCog, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { userAPI, roleAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    status: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkRoleModal, setShowBulkRoleModal] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const canCreateUser = hasPermission(['user_create']);
  const canEditUser = hasPermission(['user_update']);
  const canDeleteUser = hasPermission(['user_delete']);
  const canBulkUpload = hasPermission(['user_create']);
  const canManageRoles = hasPermission(['role_manage']);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [currentPage, searchTerm, pageSize]);
  
  // Fetch all available roles
  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getRoles();
      if (response.data && Array.isArray(response.data)) {
        setRoles(response.data);
      } else if (response.data && Array.isArray(response.data.roles)) {
        setRoles(response.data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Handle selecting individual users
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
    
    // Update selectAll state if needed
    if (selectAll && users.length > 0) {
      setSelectAll(false);
    }
  };

  // Handle select all users
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      const allUserIds = users.map(user => user.user_id);
      setSelectedUsers(allUserIds);
    }
    setSelectAll(!selectAll);
  };

  // Handle bulk delete action
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setBulkActionLoading(true);
      
      // Make API call to delete multiple users
      await userAPI.bulkDeleteUsers(selectedUsers);
      
      toast.success(`Successfully deleted ${selectedUsers.length} users`);
      setShowBulkDeleteModal(false);
      setSelectedUsers([]);
      setSelectAll(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete users. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle bulk role assignment
  const handleBulkRoleAssignment = async (roleId) => {
    if (selectedUsers.length === 0 || !roleId) return;
    
    try {
      setBulkActionLoading(true);
      
      // Check if we should replace existing roles or add to them
      const replaceRoles = selectedUser?.replaceRoles || false;
      
      // Make API call to assign role to multiple users
      await userAPI.bulkAssignRole(selectedUsers, roleId, replaceRoles);
      
      // Update UI optimistically for better UX
      if (replaceRoles) {
        // If replacing roles, update each user to only have the new role
        const role = roles.find(r => r.role_id.toString() === roleId);
        if (role) {
          setUsers(users.map(user => 
            selectedUsers.includes(user.user_id) 
              ? { ...user, roles: [role] } 
              : user
          ));
        }
      } else {
        // If adding role, append it to existing roles if not already present
        const role = roles.find(r => r.role_id.toString() === roleId);
        if (role) {
          setUsers(users.map(user => {
            if (selectedUsers.includes(user.user_id)) {
              const hasRole = user.roles?.some(r => r.role_id.toString() === roleId);
              return {
                ...user,
                roles: hasRole ? user.roles : [...(user.roles || []), role]
              };
            }
            return user;
          }));
        }
      }
      
      toast.success(`Successfully ${replaceRoles ? 'set' : 'assigned'} role for ${selectedUsers.length} users`);
      setShowBulkRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error assigning roles:', error);
      toast.error('Failed to assign roles. Please try again.');
      // Refresh the list to ensure consistency
      fetchUsers();
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle individual user status toggle
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      
      // Update UI optimistically for better UX
      setUsers(users.map(user => {
        if (user.user_id === userId) {
          return { ...user, is_active: newStatus };
        }
        return user;
      }));
      
      // Make API call to toggle status
      await userAPI.toggleUserStatus(userId, newStatus);
      
      // Show success notification
      toast.success(`User status ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status. Please try again.');
      
      // Revert UI on error
      fetchUsers();
    }
  };
  
  // Handle bulk status toggle
  const handleBulkStatusToggle = async (isActive) => {
    if (selectedUsers.length === 0) return;
    
    try {
      setBulkActionLoading(true);
      
      // Make API call to toggle status for multiple users
      await userAPI.bulkToggleStatus(selectedUsers, isActive);
      
      toast.success(`Successfully ${isActive ? 'activated' : 'deactivated'} ${selectedUsers.length} users`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        mobile_number: searchTerm || undefined
      };
      
      const response = await userAPI.getUsers(params);
      
      // Store all users for client-side filtering
      const fetchedUsers = response.data.users;
      setAllUsers(fetchedUsers);
      setUsers(fetchedUsers);
      setTotalUsers(response.data.total);
      setTotalPages(Math.ceil(response.data.total / pageSize));
      
      // Apply any existing filters
      applyFilters(fetchedUsers);
      
      // Clear selections when fetching new users
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (usersToFilter = allUsers) => {
    if (!usersToFilter || usersToFilter.length === 0) return;
    
    let filteredResults = [...usersToFilter];
    
    // Apply name filter
    if (filters.name) {
      filteredResults = filteredResults.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return fullName.includes(filters.name.toLowerCase());
      });
    }
    
    // Apply email filter
    if (filters.email) {
      filteredResults = filteredResults.filter(user => 
        user.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    
    // Apply mobile filter
    if (filters.mobile) {
      filteredResults = filteredResults.filter(user => 
        user.mobile_number && user.mobile_number.includes(filters.mobile)
      );
    }
    
    // Apply role filter
    if (filters.role) {
      filteredResults = filteredResults.filter(user => 
        user.roles && user.roles.some(role => 
          role.name.toLowerCase().includes(filters.role.toLowerCase())
        )
      );
    }
    
    // Apply status filter
    if (filters.status) {
      const isActive = filters.status.toLowerCase() === 'active';
      filteredResults = filteredResults.filter(user => user.is_active === isActive);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filteredResults.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'id':
            aValue = a.user_id;
            bValue = b.user_id;
            break;
          case 'firstName':
            aValue = a.first_name || '';
            bValue = b.first_name || '';
            break;
          case 'lastName':
            aValue = a.last_name || '';
            bValue = b.last_name || '';
            break;
          case 'name':
            aValue = `${a.first_name} ${a.last_name}`;
            bValue = `${b.first_name} ${b.last_name}`;
            break;
          case 'email':
            aValue = a.email || '';
            bValue = b.email || '';
            break;
          case 'mobile':
            aValue = a.mobile_number || '';
            bValue = b.mobile_number || '';
            break;
          case 'role':
            // Sort by the first role name, or empty string if no roles
            aValue = a.roles && a.roles.length > 0 ? a.roles[0].name : '';
            bValue = b.roles && b.roles.length > 0 ? b.roles[0].name : '';
            break;
          case 'status':
            aValue = a.is_active;
            bValue = b.is_active;
            break;
          case 'created':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setUsers(filteredResults);
  };
  
  // Handle filter change
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Apply filters when filters state changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, sortConfig]);
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      email: '',
      mobile: '',
      role: '',
      status: ''
    });
    setShowFilters(false);
    setSortConfig({ key: null, direction: 'asc' });
    setUsers(allUsers);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(Number(size));
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Render sort icon based on current sort configuration
  const renderSortIcon = (column) => {
    if (sortConfig.key !== column) {
      return <FaSort className="ms-2" size={12} />;
    }
    
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="ms-2" size={12} /> : 
      <FaSortDown className="ms-2" size={12} />;
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchUsers();
  };

  // Handle role update for a single user
  const handleUpdateUserRoles = async (selectedRoleIds) => {
    if (!selectedUser) return;
    
    try {
      setSavingRole(true);
      
      // Get existing user data and just update the roles
      const userData = {
        roles: selectedRoleIds
      };
      
      await userAPI.updateUser(selectedUser.user_id, userData);
      
      // Update user in local state
      const updatedRoles = roles.filter(role => selectedRoleIds.includes(role.role_id));
      
      setUsers(users.map(user => {
        if (user.user_id === selectedUser.user_id) {
          return { ...user, roles: updatedRoles };
        }
        return user;
      }));
      
      toast.success('User roles updated successfully');
      setShowRoleModal(false);
    } catch (error) {
      console.error('Error updating user roles:', error);
      toast.error('Failed to update user roles');
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col md={6}>
          <h2>User Management</h2>
          <p className="text-muted">Manage system users and their access</p>
        </Col>
        <Col md={6} className="text-md-end">
          <div className="d-flex gap-2 justify-content-end">
            {selectedUsers.length > 0 && (
              <>
                {canDeleteUser && (
                  <Button 
                    variant="danger" 
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="d-inline-flex align-items-center"
                    disabled={bulkActionLoading}
                  >
                    <FaTrash className="me-2" /> Delete Selected ({selectedUsers.length})
                  </Button>
                )}
                
                {canEditUser && (
                  <Dropdown>
                    <Dropdown.Toggle variant="secondary" id="dropdown-bulk-actions">
                      <FaUsersCog className="me-2" /> Bulk Actions
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setShowBulkRoleModal(true)}>
                        <FaUserTag className="me-2" /> Assign Role
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleBulkStatusToggle(true)}>
                        <FaToggleOn className="me-2" /> Activate Users
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleBulkStatusToggle(false)}>
                        <FaToggleOff className="me-2" /> Deactivate Users
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </>
            )}
            
            {canCreateUser && (
              <>
                <Button 
                  variant="primary" 
                  as={Link} 
                  to="/users/create"
                  className="d-inline-flex align-items-center"
                >
                  <FaPlus className="me-2" /> Add New User
                </Button>
                
                {canBulkUpload && (
                  <Button 
                    variant="outline-primary" 
                    as={Link} 
                    to="/users/bulk-upload"
                    className="d-inline-flex align-items-center"
                  >
                    <FaPlus className="me-2" /> Bulk Upload
                  </Button>
                )}
              </>
            )}
          </div>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }}>
                <InputGroup>
                  <Form.Control 
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit">
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={6} className="text-end">
              <Button 
                variant={showFilters ? "primary" : "outline-primary"} 
                className="me-2" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-1" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              {showFilters && (
                <Button 
                  variant="outline-secondary" 
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Col>
          </Row>
          
          {showFilters && (
            <Row className="mb-3 g-2">
              <Col sm={6} md={2}>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by name"
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={2}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by email"
                    value={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={2}>
                <Form.Group>
                  <Form.Label>Mobile</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by mobile"
                    value={filters.mobile}
                    onChange={(e) => handleFilterChange('mobile', e.target.value)}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={2}>
                <Form.Group>
                  <Form.Label>Role</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by role"
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={2}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    size="sm"
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th className="text-center" onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                    ID {renderSortIcon('id')}
                  </th>
                  <th onClick={() => handleSort('firstName')} style={{ cursor: 'pointer' }}>
                    First Name {renderSortIcon('firstName')}
                  </th>
                  <th onClick={() => handleSort('lastName')} style={{ cursor: 'pointer' }}>
                    Last Name {renderSortIcon('lastName')}
                  </th>
                  <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    Email {renderSortIcon('email')}
                  </th>
                  <th onClick={() => handleSort('mobile')} style={{ cursor: 'pointer' }}>
                    Mobile {renderSortIcon('mobile')}
                  </th>
                  <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                    Role {renderSortIcon('role')}
                  </th>
                  <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                    Status {renderSortIcon('status')}
                  </th>
                  <th className="text-center">
                    <div className="d-flex align-items-center justify-content-center">
                      Actions
                      {canManageRoles && (
                        <Tooltip title="Manage User Roles">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 ms-2"
                            onClick={() => setShowRoleManagement(!showRoleManagement)}
                          >
                            <FaUserTag />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="text-center">{user.user_id}</td>
                    <td>{user.first_name}</td>
                    <td>{user.last_name}</td>
                    <td>{user.email}</td>
                    <td>{user.mobile_number || 'N/A'}</td>
                    <td>
                      {canEditUser ? (
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm" id={`role-dropdown-${user.user_id}`}>
                            {user.roles && user.roles.length > 0 ? user.roles.map(role => role.name).join(', ') : 'No Role'}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {roles.map(role => (
                              <Dropdown.Item 
                                key={role.role_id}
                                onClick={() => {
                                  // Set the selected user and pre-select their current roles
                                  setSelectedUser({
                                    ...user,
                                    roles: user.roles || []
                                  });
                                  setShowRoleModal(true);
                                }}
                              >
                                {role.name}
                              </Dropdown.Item>
                            ))}
                          </Dropdown.Menu>
                        </Dropdown>
                      ) : (
                        <span>
                          {user.roles && user.roles.length > 0 ? user.roles.map(role => role.name).join(', ') : 'No Role'}
                        </span>
                      )}
                    </td>
                    <td>
                      {canEditUser ? (
                        <Button 
                          variant={user.is_active ? 'success' : 'danger'}
                          size="sm"
                          className="d-inline-flex align-items-center"
                          onClick={() => handleToggleUserStatus(user.user_id, user.is_active)}
                          disabled={user.email === 'admin@example.com'} // Protect admin account
                        >
                          {user.is_active ? 
                            <><FaToggleOn className="me-1" /> Active</> : 
                            <><FaToggleOff className="me-1" /> Inactive</>
                          }
                        </Button>
                      ) : (
                        <Badge bg={user.is_active ? 'success' : 'danger'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex">
                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          className="me-2" 
                          onClick={() => navigate(`/users/edit/${user.user_id}`)} 
                          title="Edit user"
                        >
                          <FaEdit />
                        </Button>
                        {canEditUser && (
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2" 
                            onClick={() => {
                              // Set the selected user and pre-select their current roles
                              setSelectedUser({
                                ...user,
                                roles: user.roles || []
                              });
                              setShowRoleModal(true);
                            }}
                            title="Change role"
                          >
                            <FaUserTag />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          
          {users.length > 0 && (
            <Row className="mt-4">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <span className="me-2">Showing {users.length} of {totalUsers} users</span>
                    <Form.Group className="d-flex align-items-center">
                      <Form.Label className="mb-0 me-2">Rows per page:</Form.Label>
                      <Form.Select 
                        size="sm" 
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        style={{ width: '80px' }}
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <Pagination className="mb-0">
                    <Pagination.First disabled={currentPage === 1} onClick={() => handlePageChange(1)} />
                    <Pagination.Prev disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} />
                    
                    {[...Array(totalPages).keys()].map(page => {
                      const pageNumber = page + 1;
                      // Only show a few pages around current page for better UI
                      if (
                        pageNumber === 1 || 
                        pageNumber === totalPages || 
                        Math.abs(pageNumber - currentPage) <= 2
                      ) {
                        return (
                          <Pagination.Item 
                            key={pageNumber} 
                            active={pageNumber === currentPage}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </Pagination.Item>
                        );
                      } else if (
                        pageNumber === 2 || 
                        pageNumber === totalPages - 1
                      ) {
                        // Show ellipsis for better pagination UI
                        return <Pagination.Ellipsis key={pageNumber} />;
                      }
                      return null;
                    })}
                    
                    <Pagination.Next disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} />
                    <Pagination.Last disabled={currentPage === totalPages} onClick={() => handlePageChange(totalPages)} />
                  </Pagination>
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
      
      {/* User Role Management Modal */}
      <Modal 
        show={showRoleModal} 
        onHide={() => setShowRoleModal(false)} 
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit User Roles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p>
                <strong>User:</strong> {selectedUser.first_name} {selectedUser.last_name}
              </p>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Assign Roles</Form.Label>
                  {roles.map(role => {
                    const isChecked = selectedUser.roles?.some(userRole => 
                      userRole.role_id === role.role_id
                    );
                    
                    return (
                      <Form.Check 
                        key={role.role_id}
                        type="checkbox"
                        id={`role-${role.role_id}`}
                        label={role.name}
                        defaultChecked={isChecked}
                        onChange={(e) => {
                          // Update selected user roles when checkbox is toggled
                          if (e.target.checked) {
                            // Add role if not already added
                            if (!selectedUser.roles.some(r => r.role_id === role.role_id)) {
                              setSelectedUser({
                                ...selectedUser,
                                roles: [...selectedUser.roles, role]
                              });
                            }
                          } else {
                            // Remove role
                            setSelectedUser({
                              ...selectedUser,
                              roles: selectedUser.roles.filter(r => r.role_id !== role.role_id)
                            });
                          }
                        }}
                      />
                    );
                  })}
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (selectedUser) {
                const selectedRoleIds = selectedUser.roles.map(role => role.role_id);
                handleUpdateUserRoles(selectedRoleIds);
              }
            }}
            disabled={savingRole}
          >
            {savingRole ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Bulk Delete Modal */}
      <Modal show={showBulkDeleteModal} onHide={() => setShowBulkDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Multiple Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete {selectedUsers.length} selected users? This action cannot be undone.</p>
          
          <Alert variant="danger">
            <strong>Warning:</strong> Deleting users will remove all their associated data and access rights.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleBulkDelete}
            disabled={bulkActionLoading}
          >
            {bulkActionLoading ? 'Deleting...' : `Delete ${selectedUsers.length} Users`}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Bulk Role Assignment Modal */}
      <Modal 
        show={showBulkRoleModal} 
        onHide={() => {
          setShowBulkRoleModal(false);
          setSelectedUser(prev => ({ ...prev, replaceRoles: false })); // Reset replace option
        }} 
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FaUsersCog className="me-2" />
            <div>
              <div>Assign Role to {selectedUsers.length} Users</div>
              <div className="text-muted small fw-normal">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Select a role to assign to <strong>{selectedUsers.length}</strong> selected users:</p>
          
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold d-block mb-3">Select Role to Assign</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              {roles.map(role => (
                <div key={role.role_id} className="position-relative">
                  <Button
                    variant={selectedUser?.roleId === role.role_id.toString() ? 'primary' : 'outline-secondary'}
                    className="mb-2 text-start"
                    style={{ minWidth: '120px' }}
                    onClick={() => setSelectedUser({ 
                      ...selectedUser, 
                      roleId: role.role_id.toString(),
                      roleName: role.name 
                    })}
                  >
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">{role.name}</div>
                      {selectedUser?.roleId === role.role_id.toString() && (
                        <div className="ms-2">✓</div>
                      )}
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="replaceExistingRoles"
                checked={selectedUser?.replaceRoles || false}
                onChange={(e) => setSelectedUser({ 
                  ...selectedUser, 
                  replaceRoles: e.target.checked 
                })}
              />
              <label className="form-check-label fw-bold" htmlFor="replaceExistingRoles">
                Replace existing roles
              </label>
              <div className="form-text">
                {selectedUser?.replaceRoles 
                  ? 'Existing roles will be removed and replaced with the selected role.'
                  : 'The selected role will be added to the user\'s existing roles.'}
              </div>
            </div>
          </Form.Group>
          
          <Alert variant="info" className="d-flex">
            <div className="me-2">
              <i className="fas fa-info-circle"></i>
            </div>
            <div>
              <strong className="d-block mb-2">Role Management Guidelines</strong>
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex mb-2">
                    <div className="me-2 text-success">✓</div>
                    <div>Select a role and click "Assign Role" to apply changes</div>
                  </div>
                  <div className="d-flex mb-2">
                    <div className="me-2 text-success">✓</div>
                    <div>Use the toggle to replace all existing roles if needed</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex mb-2">
                    <div className="me-2 text-warning">!</div>
                    <div>Admin users' roles cannot be modified from this interface</div>
                  </div>
                  <div className="d-flex">
                    <div className="me-2 text-info">i</div>
                    <div>Changes may take a moment to reflect across all systems</div>
                  </div>
                </div>
              </div>
            </div>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkRoleModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleBulkRoleAssignment(selectedUser?.roleId)}
            disabled={bulkActionLoading || !selectedUser?.roleId}
          >
            {bulkActionLoading ? 'Assigning...' : 'Assign Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserList;

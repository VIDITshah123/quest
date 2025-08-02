import React, { useState, useEffect, useMemo } from 'react';
import styles from './RoleList.module.css';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaShieldAlt, FaSearch, FaFilter, FaEllipsisV, FaKey, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { roleAPI, permissionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    description: '',
    permission: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRoles, setTotalRoles] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const canCreateRole = hasPermission(['role_create']);
  const canEditRole = hasPermission(['role_update']);
  const canDeleteRole = hasPermission(['role_delete']);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, []);
  
  // Fetch all available permissions
  const fetchPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const response = await permissionAPI.getPermissions();
      if (response.data && Array.isArray(response.data)) {
        setPermissions(response.data);
      } else if (response.data && Array.isArray(response.data.permissions)) {
        setPermissions(response.data.permissions);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // Prepare API request parameters
      const params = {
        page: currentPage,
        limit: pageSize,
        // Add other filter params if needed
      };
      
      const response = await roleAPI.getRoles(params);
      
      if (response.data) {
        // Determine the structure of the response
        if (Array.isArray(response.data)) {
          // API returns array directly
          setRoles(response.data);
          setTotalRoles(response.data.length);
        } else if (response.data.roles) {
          // API returns { roles: [...], total: number }
          setRoles(response.data.roles);
          setTotalRoles(response.data.total || response.data.roles.length);
        } else {
          console.error('Unexpected response format:', response.data);
          toast.error('Received unexpected data format from server');
          setRoles([]);
        }
      }
      
      // Clear selections when fetching new roles
      setSelectedRoles([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles. Please try again.');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roles.length > 0) {
      let filtered = [...roles];
      
      // Apply search term filter
      if (searchTerm) {
        filtered = filtered.filter(role => 
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply other filters
      if (filters.name) {
        filtered = filtered.filter(role =>
          role.name.toLowerCase().includes(filters.name.toLowerCase())
        );
      }
      
      if (filters.description) {
        filtered = filtered.filter(role =>
          role.description.toLowerCase().includes(filters.description.toLowerCase())
        );
      }
      
      if (filters.permission) {
        filtered = filtered.filter(role =>
          role.permissions && role.permissions.some(permission =>
            permission.name.toLowerCase().includes(filters.permission.toLowerCase())
          )
        );
      }
      
      // Apply sorting
      if (sortConfig.key) {
        filtered.sort((a, b) => {
          let aValue, bValue;
          
          switch (sortConfig.key) {
            case 'name':
              aValue = a.name || '';
              bValue = b.name || '';
              break;
            case 'description':
              aValue = a.description || '';
              bValue = b.description || '';
              break;
            case 'permissions':
              aValue = a.permissions ? a.permissions.length : 0;
              bValue = b.permissions ? b.permissions.length : 0;
              break;
            case 'created_at':
              aValue = new Date(a.created_at || 0);
              bValue = new Date(b.created_at || 0);
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
      
      // Set total count for pagination
      setTotalRoles(filtered.length);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize;
      filtered = filtered.slice(startIndex, startIndex + pageSize);
      
      setFilteredRoles(filtered);
    } else {
      setFilteredRoles([]);
      setTotalRoles(0);
    }
  }, [roles, searchTerm, filters, sortConfig, currentPage, pageSize]);

  const handleDeleteRole = async (roleId, roleName) => {
    // Prevent deletion of system roles
    if (['Admin', 'System'].includes(roleName)) {
      toast.error(`The ${roleName} role cannot be deleted as it is a system role.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the "${roleName}" role? This action cannot be undone.`)) {
      try {
        await roleAPI.deleteRole(roleId);
        toast.success(`Role "${roleName}" deleted successfully`);
        
        // Remove role from local state
        setRoles(roles.filter(role => role.role_id !== roleId));
      } catch (error) {
        console.error('Error deleting role:', error);
        toast.error('Failed to delete role. It may be assigned to users or have other dependencies.');
      }
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle column header click for sorting
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
  
  // Handle filter change
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      name: '',
      description: '',
      permission: ''
    });
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' });
    setShowFilters(false);
    setCurrentPage(1); // Reset to first page
  };
  
  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle opening permission edit modal
  const handleShowPermissionModal = (role) => {
    setSelectedRole(role);
    
    // Initialize selected permissions from the role
    const permissionIds = role.permissions ? 
      role.permissions.map(permission => permission.permission_id) : 
      [];
    
    setSelectedPermissionIds(permissionIds);
    setShowPermissionModal(true);
  };
  
  // Memoize permissions for performance
  const permissionsMemo = useMemo(() => permissions, [permissions]);
  
  // Group permissions by category for better organization in modal
  const groupedPermissions = permissionsMemo.reduce((acc, permission) => {
    const category = permission.name.split('_')[0]; // Assuming permissions are named like "user_create"
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {});
  
  // Handle permission checkbox change
  const handlePermissionChange = (permissionId, isChecked) => {
    if (isChecked) {
      setSelectedPermissionIds(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissionIds(prev => prev.filter(id => id !== permissionId));
    }
  };
  
  // Handle saving role permissions
  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    try {
      setSavingPermissions(true);
      
      await permissionAPI.assignPermissions(selectedRole.role_id, selectedPermissionIds);

      // Update the role in local state with new permissions
      const updatedPermissions = permissions.filter(p => selectedPermissionIds.includes(p.permission_id));

      setRoles(roles.map(role => {
        if (role.role_id === selectedRole.role_id) {
          return { ...role, permissions: updatedPermissions };
        }
        return role;
      }));

      // Also update filtered roles
      setFilteredRoles(filteredRoles.map(role => {
        if (role.role_id === selectedRole.role_id) {
          return { ...role, permissions: updatedPermissions };
        }
        return role;
      }));

      toast.success(`Permissions updated for ${selectedRole.name}`);
      setShowPermissionModal(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to update permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  // Handle selecting individual roles
  const handleSelectRole = (roleId) => {
    // Check if the role is a system role (Admin or System)
    const role = roles.find(r => r.role_id === roleId);
    if (role && ['Admin', 'System'].includes(role.name)) {
      toast.warning(`The ${role.name} role is a system role and cannot be selected for bulk operations.`);
      return;
    }

    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });

    // Update selectAll state if needed
    if (selectAll && filteredRoles.length > 0) {
      setSelectAll(false);
    }
  };

  // Handle bulk delete action
  const handleBulkDelete = async () => {
    if (selectedRoles.length === 0) return;
    
    // Filter out system roles
    const systemRoleIds = roles
      .filter(role => ['Admin', 'System'].includes(role.name))
      .map(role => role.role_id);
    
    const deletableRoleIds = selectedRoles.filter(id => !systemRoleIds.includes(id));
    
    // If all selected roles are system roles, show error
    if (deletableRoleIds.length === 0) {
      toast.error('Cannot delete system roles');
      setShowBulkDeleteModal(false);
      return;
    }
    
    try {
      setBulkActionLoading(true);
      
      // Make API call to delete multiple roles
      await roleAPI.bulkDeleteRoles(deletableRoleIds);
      
      toast.success(`Successfully deleted ${deletableRoleIds.length} roles`);
      setShowBulkDeleteModal(false);
      setSelectedRoles([]);
      setSelectAll(false);
      fetchRoles(); // Refresh the list
      
      // If some roles were not deleted because they're system roles, show warning
      if (deletableRoleIds.length < selectedRoles.length) {
        toast.warning(`${selectedRoles.length - deletableRoleIds.length} system roles were not deleted`);
      }
    } catch (error) {
      console.error('Error deleting roles:', error);
      toast.error('Failed to delete roles. They may be assigned to users or have other dependencies.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle select all roles
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(filteredRoles.map(role => role.role_id));
    }
    setSelectAll(!selectAll);
  };

  return (
    <Container fluid>
      <Card className="mb-4 glass-card">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <h2 className={styles.title}>
                <FaShieldAlt className="me-2" /> Role Management
              </h2>
              <p className="text-muted">Manage system roles and their permissions</p>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="d-flex gap-2 justify-content-end">
                {selectedRoles.length > 0 && canDeleteRole && (
                  <Button 
                    variant="danger" 
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="d-inline-flex align-items-center"
                    disabled={bulkActionLoading}
                  >
                    <FaTrash className="me-2" /> Delete Selected ({selectedRoles.length})
                  </Button>
                )}
                
                {canCreateRole && (
                  <Button 
                    variant="primary" 
                    as={Link} 
                    to="/roles/create"
                    className="d-inline-flex align-items-center"
                  >
                    <FaPlus className="me-2" /> Add New Role
                  </Button>
                )}
              </div>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col md={6}>
              <h6>Search Roles</h6>
              <InputGroup>
                <Form.Control 
                  type="search" 
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Button variant="outline-secondary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <Button 
                variant={showFilters ? "primary" : "outline-primary"} 
                className="me-2 glass-btn" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter className="me-1" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              {showFilters && (
                <Button 
                  variant="outline-secondary" 
                  onClick={clearFilters}
                  className="glass-btn"
                >
                  Clear Filters
                </Button>
              )}
            </Col>
          </Row>
          
          {showFilters && (
            <Row className="mb-3 g-2">
              <Col sm={6} md={4}>
                <Form.Group>
                  <Form.Label>Role Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by role name"
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={4}>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by description"
                    value={filters.description}
                    onChange={(e) => handleFilterChange('description', e.target.value)}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={4}>
                <Form.Group>
                  <Form.Label>Permission</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by permission"
                    value={filters.permission}
                    onChange={(e) => handleFilterChange('permission', e.target.value)}
                    size="sm"
                  />
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
            <div className="table-responsive table-container glass-table">
              <Table hover responsive>
                <thead>
                  <tr>
                    <th style={{width: '40px'}}>
                      <Form.Check
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        aria-label="Select all roles"
                        disabled={filteredRoles.length === 0}
                      />
                    </th>
                    <th onClick={() => handleSort('name')} style={{cursor: 'pointer'}}>
                      Role Name {renderSortIcon('name')}
                    </th>
                    <th onClick={() => handleSort('description')} style={{cursor: 'pointer'}}>
                      Description {renderSortIcon('description')}
                    </th>
                    <th onClick={() => handleSort('permissions')} style={{cursor: 'pointer'}}>
                      Permissions {renderSortIcon('permissions')}
                    </th>
                    <th onClick={() => handleSort('created_at')} style={{cursor: 'pointer'}}>
                      Created {renderSortIcon('created_at')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((role, index) => (
                      <tr key={role.role_id}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedRoles.includes(role.role_id)}
                            onChange={() => handleSelectRole(role.role_id)}
                            aria-label={`Select role ${role.name}`}
                            // Disable checkbox for system roles
                            disabled={['Admin', 'System'].includes(role.name)}
                          />
                        </td>
                        <td>{role.name}</td>
                        <td>{role.description || 'No description'}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Badge bg="info" className="me-2">
                              {role.permissions ? role.permissions.length : 0}
                            </Badge>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowPermissionModal(role)}
                            >
                              <FaKey className="me-1" /> Manage
                            </Button>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {canEditRole ? (
                              <Button 
                                variant="primary" 
                                size="sm" 
                                className="glass-btn" 
                                onClick={() => navigate(`/roles/edit/${role.role_id}`)} 
                                title="Edit role"
                              >
                                <FaEdit className="me-1" /> Edit Role
                              </Button>
                            ) : null}
                            {canDeleteRole && !['Admin', 'System'].includes(role.name) ? (
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => handleDeleteRole(role.role_id, role.name)}
                                title="Delete role"
                                className="glass-btn"
                              >
                                <FaTrash />
                              </Button>
                            ) : null}
                            {!(canEditRole || (canDeleteRole && !['Admin', 'System'].includes(role.name))) && (
                              <span style={{minWidth: '36px', display: 'inline-block'}}></span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        {searchTerm ? 'No roles match your search criteria.' : 'No roles found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
          
          {!loading && filteredRoles.length > 0 && (
            <Row className="mt-4">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <span className="me-2">
                      Showing {filteredRoles.length} of {totalRoles} roles
                    </span>
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
                  {totalRoles > pageSize && (
                    <nav>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                          >
                            First
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            &laquo;
                          </button>
                        </li>
                        
                        {/* Generate pagination numbers */}
                        {Array.from({ length: Math.ceil(totalRoles / pageSize) }, (_, i) => i + 1)
                          .filter(p => {
                            // Show only a few pages around current page
                            return p === 1 || 
                                  p === Math.ceil(totalRoles / pageSize) || 
                                  Math.abs(p - currentPage) <= 2;
                          })
                          .map((page, index, array) => {
                            // Add ellipsis when there are gaps
                            if (index > 0 && array[index - 1] !== page - 1) {
                              return [
                                <li key={`ellipsis-${page}`} className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>,
                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(page)}
                                  >
                                    {page}
                                  </button>
                                </li>
                              ];
                            }
                            return (
                              <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </button>
                              </li>
                            );
                          })}
                          
                        <li className={`page-item ${currentPage === Math.ceil(totalRoles / pageSize) ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === Math.ceil(totalRoles / pageSize)}
                          >
                            &raquo;
                          </button>
                        </li>
                        <li className={`page-item ${currentPage === Math.ceil(totalRoles / pageSize) ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(Math.ceil(totalRoles / pageSize))}
                            disabled={currentPage === Math.ceil(totalRoles / pageSize)}
                          >
                            Last
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
      
      {/* Permission Modal */}
      <Modal 
        show={showPermissionModal} 
        onHide={() => setShowPermissionModal(false)}
        size="lg"
        backdrop="static"
        className="glass-modal-container"
      >
        <div className="glass-modal">
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedRole && (
                <span>Edit Permissions for <strong>{selectedRole.name}</strong></span>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {permissionsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading permissions...</p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6>Select Permissions</h6>
                  </div>
                </div>
                
                <Form>
                  <Row>
                    {permissionsMemo.map(permission => (
                      <Col md={4} key={permission.permission_id} className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id={`permission-${permission.permission_id}`}
                          label={permission.name}
                          checked={selectedPermissionIds.includes(permission.permission_id)}
                          onChange={() => {
                            if (selectedPermissionIds.includes(permission.permission_id)) {
                              setSelectedPermissionIds(prev => 
                                prev.filter(id => id !== permission.permission_id)
                              );
                            } else {
                              setSelectedPermissionIds(prev => 
                                [...prev, permission.permission_id]
                              );
                            }
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPermissionModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePermissions}
              disabled={savingPermissions}
            >
              {savingPermissions ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
      
      {/* Bulk Delete Modal */}
      <Modal show={showBulkDeleteModal} onHide={() => setShowBulkDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Multiple Roles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete {selectedRoles.length} selected roles? This action cannot be undone.</p>
          
          {/* Check if any selected roles are system roles */}
          {selectedRoles.some(roleId => {
            const role = roles.find(r => r.role_id === roleId);
            return role && ['Admin', 'System'].includes(role.name);
          }) && (
            <Alert variant="warning">
              <strong>Note:</strong> System roles (Admin, System) cannot be deleted and will be skipped.
            </Alert>
          )}
          
          <Alert variant="danger">
            <strong>Warning:</strong> Deleting roles may impact user permissions across the system.
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
            {bulkActionLoading ? 'Deleting...' : `Delete Selected Roles`}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RoleList;

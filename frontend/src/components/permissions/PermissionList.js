import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal, ListGroup, Spinner, Alert, Accordion } from 'react-bootstrap';
import { FaSearch, FaShieldAlt, FaInfoCircle, FaSort, FaSortUp, FaSortDown, FaPlus, FaLink, FaRoute, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { permissionAPI, roleAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const PermissionList = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPermissions, setFilteredPermissions] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [missingRoutes, setMissingRoutes] = useState([]);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showRolePermissionModal, setShowRolePermissionModal] = useState(false);
  const [rolesWithPermissions, setRolesWithPermissions] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [creatingRoutes, setCreatingRoutes] = useState(false);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // Safely access auth context with fallbacks to prevent null reference errors
  const auth = useAuth() || {};
  const { hasPermission = () => false } = auth;
  const canViewPermissions = typeof hasPermission === 'function' && hasPermission(['permission_view']);
  const canAssignPermissions = typeof hasPermission === 'function' && hasPermission(['permission_assign']);

  // Fetch permissions on component load
  useEffect(() => {
    if (canViewPermissions) {
      fetchPermissions();
      fetchAvailableRoles();
    } else {
      setLoading(false);
    }
  }, [canViewPermissions]);

  // Filter permissions based on search term and category
  useEffect(() => {
    if (permissions.length > 0) {
      let filtered = [...permissions];
      
      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(permission => 
          permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          permission.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by category
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(permission => 
          permission.name.startsWith(selectedCategory + '_')
        );
      }
      
      // Apply sorting
      if (sortConfig.key) {
        filtered.sort((a, b) => {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
      
      setFilteredPermissions(filtered);
    }
  }, [permissions, searchTerm, selectedCategory, sortConfig]);

  // Extract unique categories from permissions
  useEffect(() => {
    if (permissions.length > 0) {
      const uniqueCategories = [...new Set(
        permissions.map(permission => permission.name.split('_')[0])
      )];
      setCategories(uniqueCategories);
    }
  }, [permissions]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionAPI.getPermissions();
      // The backend returns data in the format { count, permissions }, so we need to access the permissions array
      if (response.data && response.data.permissions) {
        setPermissions(response.data.permissions);
        setFilteredPermissions(response.data.permissions);
      } else {
        console.error('Unexpected response format:', response.data);
        toast.error('Failed to load permissions: unexpected data format');
        setPermissions([]);
        setFilteredPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMissingRoutes = async () => {
    try {
      setLoadingMissing(true);
      const response = await permissionAPI.getMissingRoutes();
      setMissingRoutes(response.data);
    } catch (error) {
      console.error('Error fetching missing routes:', error);
      toast.error('Failed to load missing routes');
    } finally {
      setLoadingMissing(false);
    }
  };

  const fetchRolesWithPermissions = async () => {
    try {
      setLoadingRoles(true);
      const response = await permissionAPI.getRolesWithPermissions();
      setRolesWithPermissions(response.data.roles);
    } catch (error) {
      console.error('Error fetching roles with permissions:', error);
      toast.error('Failed to load roles with permissions');
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await roleAPI.getRoles();
      setAvailableRoles(response.data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleShowMissingRoutes = () => {
    setShowMissingModal(true);
    fetchMissingRoutes();
  };

  const handleShowRolePermissions = () => {
    setShowRolePermissionModal(true);
    fetchRolesWithPermissions();
  };

  const handleCreateMissingRoutes = async (selectedPermissions) => {
    try {
      setCreatingRoutes(true);
      const response = await permissionAPI.createMissingRoutes(selectedPermissions);
      toast.success(`Created ${response.data.results.created.length} route permissions`);
      
      if (response.data.results.errors.length > 0) {
        toast.warning(`${response.data.results.errors.length} permissions had errors`);
      }
      
      // Refresh permissions list
      fetchPermissions();
      fetchMissingRoutes();
    } catch (error) {
      console.error('Error creating missing routes:', error);
      toast.error('Failed to create route permissions');
    } finally {
      setCreatingRoutes(false);
    }
  };

  const handleAssignPermissionToRole = async (roleId, permissionIds) => {
    try {
      const currentRole = rolesWithPermissions.find(r => r.role_id === roleId);
      const currentPermissionIds = currentRole ? currentRole.permissions.map(p => p.permission_id) : [];
      
      // Merge existing permissions with new ones
      const updatedPermissionIds = [...new Set([...currentPermissionIds, ...permissionIds])];
      
      await permissionAPI.assignPermissions(roleId, updatedPermissionIds);
      toast.success('Permissions assigned successfully');
      
      // Refresh data
      fetchRolesWithPermissions();
    } catch (error) {
      console.error('Error assigning permissions:', error);
      toast.error('Failed to assign permissions');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <FaSort className="ms-1 text-muted" />;
    }
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="ms-1 text-primary" /> : 
      <FaSortDown className="ms-1 text-primary" />;
  };

  if (!canViewPermissions) {
    return (
      <Container fluid>
        <Card className="text-center p-5">
          <Card.Body>
            <FaShieldAlt size={48} className="text-muted mb-3" />
            <h3>Access Restricted</h3>
            <p className="text-muted">
              You don't have permission to view this page. Please contact your administrator if you 
              believe you should have access.
            </p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h2>System Permissions</h2>
          <p className="text-muted">View all system permissions and their assignments</p>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Row className="mb-3 align-items-end">
            <Col md={6}>
              <InputGroup>
                <Form.Control 
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Button variant="outline-secondary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filter by Category</Form.Label>
                <Form.Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="text-end">
              <div className="d-flex gap-2 justify-content-end align-items-center mb-2">
                {canAssignPermissions && (
                  <>
                    <Button variant="outline-warning" size="sm" onClick={handleShowMissingRoutes}>
                      <FaRoute className="me-1" />
                      Missing Routes
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={handleShowRolePermissions}>
                      <FaLink className="me-1" />
                      Role Permissions
                    </Button>
                  </>
                )}
              </div>
              <span className="text-muted">
                {filteredPermissions.length} {filteredPermissions.length === 1 ? 'permission' : 'permissions'} found
              </span>
            </Col>
          </Row>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading permissions...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover bordered className="align-middle">
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th 
                      width="25%"
                      onClick={() => requestSort('name')}
                      className="cursor-pointer"
                    >
                      Permission Name {getSortIcon('name')}
                    </th>
                    <th width="30%">Description</th>
                    <th width="20%">Category</th>
                    <th 
                      width="20%"
                      onClick={() => requestSort('created_at')}
                      className="cursor-pointer"
                    >
                      Created {getSortIcon('created_at')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.length > 0 ? (
                    filteredPermissions.map((permission, index) => {
                      const category = permission.name.split('_')[0];
                      const action = permission.name.substring(category.length + 1);
                      
                      return (
                        <tr key={permission.permission_id}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaShieldAlt className="me-2 text-primary" />
                              {permission.name}
                            </div>
                          </td>
                          <td>{permission.description}</td>
                          <td>
                            <Badge 
                              bg="secondary" 
                              className="text-capitalize"
                            >
                              {category}
                            </Badge>
                          </td>
                          <td>
                            {new Date(permission.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        {searchTerm || selectedCategory !== 'all' ? 'No permissions match your search criteria.' : 'No permissions found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <FaInfoCircle className="me-2 text-primary" />
            Understanding Permissions
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>What are Permissions?</h6>
              <p className="text-muted">
                Permissions are granular access controls that define what actions users can perform
                in the system. Each permission represents a specific capability, such as creating
                users or viewing reports. Permissions are grouped by category and are 
                typically named using the format <code>category_action</code>.
              </p>
            </Col>
            <Col md={6}>
              <h6>How Permissions Work</h6>
              <p className="text-muted">
                Permissions are not directly assigned to users. Instead, they are grouped into roles,
                which are then assigned to users. A user's effective permissions are the combined
                permissions of all roles they have. Permissions cannot be created or modified through
                the interface as they are defined by system functionality.
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Missing Routes Modal */}
      <Modal show={showMissingModal} onHide={() => setShowMissingModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaRoute className="me-2 text-warning" />
            Missing Route Permissions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingMissing ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading missing routes...</p>
            </div>
          ) : (
            <MissingRoutesContent 
              missingRoutes={missingRoutes}
              onCreateRoutes={handleCreateMissingRoutes}
              creatingRoutes={creatingRoutes}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Role Permissions Modal */}
      <Modal show={showRolePermissionModal} onHide={() => setShowRolePermissionModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaLink className="me-2 text-primary" />
            Role Permission Management
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingRoles ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Loading roles and permissions...</p>
            </div>
          ) : (
            <RolePermissionsContent 
              rolesWithPermissions={rolesWithPermissions}
              availableRoles={availableRoles}
              permissions={permissions}
              onAssignPermission={handleAssignPermissionToRole}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

// Missing Routes Content Component
const MissingRoutesContent = ({ missingRoutes, onCreateRoutes, creatingRoutes }) => {
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const handleSelectAll = (category) => {
    const categoryPermissions = missingRoutes.missing_by_category?.[category] || [];
    const isAllSelected = categoryPermissions.every(p => selectedPermissions.some(sp => sp.name === p.name));
    
    if (isAllSelected) {
      // Deselect all from this category
      setSelectedPermissions(prev => prev.filter(p => !categoryPermissions.some(cp => cp.name === p.name)));
    } else {
      // Select all from this category
      const newSelections = categoryPermissions.filter(p => !selectedPermissions.some(sp => sp.name === p.name));
      setSelectedPermissions(prev => [...prev, ...newSelections]);
    }
  };

  const handleTogglePermission = (permission) => {
    setSelectedPermissions(prev => {
      const exists = prev.some(p => p.name === permission.name);
      if (exists) {
        return prev.filter(p => p.name !== permission.name);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleCreateSelected = () => {
    if (selectedPermissions.length > 0) {
      onCreateRoutes(selectedPermissions);
    }
  };

  if (!missingRoutes.missing_permissions || missingRoutes.missing_permissions.length === 0) {
    return (
      <Alert variant="success">
        <FaShieldAlt className="me-2" />
        All routes have corresponding permissions! No missing route permissions found.
      </Alert>
    );
  }

  return (
    <div>
      <Alert variant="warning">
        <FaExclamationTriangle className="me-2" />
        Found <strong>{missingRoutes.total_missing}</strong> routes without corresponding permissions out of {missingRoutes.total_expected} total routes.
      </Alert>

      <div className="mb-3">
        <small className="text-muted">
          Select the route permissions you want to create. They will be automatically assigned to the Admin role.
        </small>
      </div>

      <Accordion>
        {Object.entries(missingRoutes.missing_by_category || {}).map(([category, permissions]) => {
          const selectedInCategory = permissions.filter(p => selectedPermissions.some(sp => sp.name === p.name)).length;
          const allSelectedInCategory = selectedInCategory === permissions.length;
          
          return (
            <Accordion.Item key={category} eventKey={category}>
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                  <span className="text-capitalize">
                    <Badge bg="secondary" className="me-2">{category.replace('_', ' ')}</Badge>
                    {permissions.length} permissions
                  </span>
                  <Badge bg={selectedInCategory > 0 ? 'primary' : 'light'} text={selectedInCategory > 0 ? 'white' : 'dark'}>
                    {selectedInCategory} selected
                  </Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="mb-2">
                  <Button 
                    variant={allSelectedInCategory ? 'outline-secondary' : 'outline-primary'} 
                    size="sm"
                    onClick={() => handleSelectAll(category)}
                  >
                    {allSelectedInCategory ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <ListGroup variant="flush">
                  {permissions.map((permission, index) => {
                    const isSelected = selectedPermissions.some(p => p.name === permission.name);
                    return (
                      <ListGroup.Item 
                        key={index}
                        className={`d-flex justify-content-between align-items-start ${isSelected ? 'bg-light' : ''}`}
                      >
                        <div className="flex-grow-1">
                          <Form.Check
                            type="checkbox"
                            id={`perm-${category}-${index}`}
                            checked={isSelected}
                            onChange={() => handleTogglePermission(permission)}
                            label={
                              <div>
                                <strong>{permission.name}</strong>
                                <br />
                                <small className="text-muted">{permission.description}</small>
                              </div>
                            }
                          />
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
      </Accordion>

      <div className="mt-3 text-end">
        <Button 
          variant="primary" 
          onClick={handleCreateSelected}
          disabled={selectedPermissions.length === 0 || creatingRoutes}
        >
          {creatingRoutes && <Spinner animation="border" size="sm" className="me-2" />}
          Create {selectedPermissions.length} Selected Permission{selectedPermissions.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
};

// Role Permissions Content Component
const RolePermissionsContent = ({ rolesWithPermissions, availableRoles, permissions, onAssignPermission }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [showUnassigned, setShowUnassigned] = useState(false);

  // Get permissions not assigned to any role
  const getUnassignedPermissions = () => {
    const assignedPermissionIds = new Set();
    rolesWithPermissions.forEach(role => {
      role.permissions.forEach(permission => {
        assignedPermissionIds.add(permission.permission_id);
      });
    });
    
    return permissions.filter(permission => !assignedPermissionIds.has(permission.permission_id));
  };

  const handleAssignToRole = () => {
    if (selectedRole && selectedPermissions.length > 0) {
      onAssignPermission(parseInt(selectedRole), selectedPermissions);
      setSelectedPermissions([]);
    }
  };

  const unassignedPermissions = getUnassignedPermissions();

  return (
    <div>
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Roles and Their Permissions</h6>
            </Card.Header>
            <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {rolesWithPermissions.map(role => (
                <div key={role.role_id} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">{role.name}</h6>
                    <Badge bg="primary">{role.permission_count} permissions</Badge>
                  </div>
                  <div className="ps-3">
                    {role.permissions.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {role.permissions.slice(0, 5).map(permission => (
                          <Badge key={permission.permission_id} bg="secondary" className="small">
                            {permission.name.length > 20 ? permission.name.substring(0, 20) + '...' : permission.name}
                          </Badge>
                        ))}
                        {role.permissions.length > 5 && (
                          <Badge bg="light" text="dark" className="small">
                            +{role.permissions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <small className="text-muted">No permissions assigned</small>
                    )}
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Assign Permissions to Role</h6>
                <Form.Check
                  type="switch"
                  id="show-unassigned"
                  label="Show unassigned only"
                  checked={showUnassigned}
                  onChange={(e) => setShowUnassigned(e.target.checked)}
                />
              </div>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Select Role</Form.Label>
                <Form.Select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">Choose a role...</option>
                  {availableRoles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Select Permissions</Form.Label>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.375rem', padding: '10px' }}>
                  {(showUnassigned ? unassignedPermissions : permissions).map(permission => (
                    <Form.Check
                      key={permission.permission_id}
                      type="checkbox"
                      id={`assign-perm-${permission.permission_id}`}
                      checked={selectedPermissions.includes(permission.permission_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions(prev => [...prev, permission.permission_id]);
                        } else {
                          setSelectedPermissions(prev => prev.filter(id => id !== permission.permission_id));
                        }
                      }}
                      label={
                        <div>
                          <strong>{permission.name}</strong>
                          <br />
                          <small className="text-muted">{permission.description}</small>
                        </div>
                      }
                      className="mb-2"
                    />
                  ))}
                  {(showUnassigned ? unassignedPermissions : permissions).length === 0 && (
                    <p className="text-muted text-center">
                      {showUnassigned ? 'All permissions are assigned to roles' : 'No permissions available'}
                    </p>
                  )}
                </div>
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
                </small>
                <Button 
                  variant="primary"
                  onClick={handleAssignToRole}
                  disabled={!selectedRole || selectedPermissions.length === 0}
                >
                  <FaPlus className="me-1" />
                  Assign to Role
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {unassignedPermissions.length > 0 && (
        <Alert variant="info" className="mt-3">
          <FaInfoCircle className="me-2" />
          There are <strong>{unassignedPermissions.length}</strong> permissions not assigned to any role.
        </Alert>
      )}
    </div>
  );
};

export default PermissionList;
